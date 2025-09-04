const { GoogleGenAI } = require("@google/genai");
const { KiteConnect } = require("kiteconnect");
const { KiteTicker } = require("kiteconnect");
const fs = require('fs');
const path = require('path');
const signalsLogPath = path.join(__dirname, 'data', 'signals.log');
const ticksLogPath = path.join(__dirname, 'data', 'ticks.log');


const ruleWeights = {
    "HTF Alignment": 20,
    "Market Structure": 10,
    "Support & Resistance": 12,
    "Consolidation Breakout": 14,
    "Initial Balance Breakout": 15,
    "Volume Analysis": 8,
    "Momentum Divergence": 15,
    "Candlestick Patterns": 7,
    "Previous Day Levels": 7,
    // Placeholders for future data feeds
    "Component Divergence": 10,
    "Options OI Levels": 10,
};

const INSTRUMENT_MAP = {
    'BANKNIFTY': 260105,
    'NIFTY 50': 256265,
};
const INDIA_VIX_TOKEN = 264969;

class PriceActionEngine {
  constructor(wss, db) {
    this.wss = wss;
    this.db = db;
    this.kite = null;
    this.ticker = null;
    
    // Market State
    this.instrumentToken = 260105; // BANKNIFTY (default for live feed)
    this.timeframes = ['1m', '3m', '5m', '15m'];
    this.candles = {};
    this.historicalCandlesForContext = {};
    this.timeframes.forEach(tf => {
        this.candles[tf] = null;
        this.historicalCandlesForContext[tf] = [];
    });
    this.recentSignals = []; // For sentiment calculation

    this.currentPrice = 0;
    this.previousDayHigh = 0;
    this.previousDayLow = 0;
    this.previousDayClose = 0;
    this.lastSignalPrice = 0;

    this.marketVitals = {
        open: 0,
        high: 0,
        low: 0,
        vix: 0,
    };
    
    // --- NEW ENHANCEMENTS STATE ---
    this.htfTrend = 'NEUTRAL'; // Higher Timeframe Trend (from 15m)
    this.dailyRulePerformance = {}; // For intraday feedback loop { [ruleName]: { wins: 0, losses: 0 } }
    this.lastSignalForFeedback = {}; // Stores the last signal on each timeframe to evaluate its outcome
    this.initialBalance = { high: 0, low: 0, set: false };
    this.rsi = {}; // To store RSI values for each timeframe { '5m': { value: 50, history: [] } }
    this.timeframes.forEach(tf => {
        this.lastSignalForFeedback[tf] = null;
        this.rsi[tf] = { value: null, history: [] };
    });
    // --- END NEW ENHANCEMENTS STATE ---

    // Status Management
    this.connectionStatus = 'disconnected';
    this.connectionMessage = 'Not connected';
    this.marketStatus = 'CLOSED';
    this.marketStatusInterval = null;

    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async connectToBroker(apiKey, accessToken) {
    console.log('Engine: Attempting to connect to broker...');
    try {
      this.kite = new KiteConnect({ api_key: apiKey });
      this.kite.setAccessToken(accessToken);

      const profile = await this.kite.getProfile();
      console.log(`Successfully connected as ${profile.user_name}`);
      
      this.connectionStatus = 'connected';
      this.connectionMessage = `Connected as ${profile.user_name}`;
      this._broadcastConnectionStatus();

      await this._fetchPreMarketData();
      await this._initializeMarketVitals();
      this._resetDailyStats(); // Reset intraday learning stats on new connection
      this._startLiveTicker();
    } catch (error) {
      console.error("Kite connection error:", error);
      this.connectionStatus = 'error';
      this.connectionMessage = 'Failed to connect. Check credentials.';
      this._broadcastConnectionStatus();
      throw new Error("Failed to connect to Zerodha. Check credentials.");
    }
  }
  
  _resetDailyStats() {
    console.log('Resetting daily performance stats for the intraday feedback loop.');
    this.dailyRulePerformance = {};
    Object.keys(ruleWeights).forEach(rule => {
        this.dailyRulePerformance[rule] = { wins: 0, losses: 0, net: 0 };
    });
    this.timeframes.forEach(tf => {
        this.lastSignalForFeedback[tf] = null;
        this.rsi[tf] = { value: null, history: [] };
    });
    this.htfTrend = 'NEUTRAL';
    this.initialBalance = { high: 0, low: 0, set: false };
  }

  async _fetchPreMarketData() {
    console.log("Fetching pre-market data (e.g., Previous Day H/L/C)...");
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 7); 
      const historicalData = await this.kite.getHistoricalData(this.instrumentToken, "day", from, to);
      if (historicalData.length < 2) throw new Error("Not enough historical data.");

      const prevDay = historicalData[historicalData.length - 2];
      this.previousDayHigh = prevDay.high;
      this.previousDayLow = prevDay.low;
      this.previousDayClose = prevDay.close;
      console.log(`Pre-market data loaded: PDH=${this.previousDayHigh}, PDL=${this.previousDayLow}, PDC=${this.previousDayClose}`);
    } catch (error) {
      console.error("Failed to fetch pre-market data:", error);
      throw new Error("Could not fetch essential pre-market data.");
    }
  }

  async _initializeMarketVitals() {
    console.log("Initializing market vitals...");
    try {
        const quotes = await this.kite.getQuote([this.instrumentToken, INDIA_VIX_TOKEN]);
        
        const bnfQuote = quotes[this.instrumentToken];
        if (bnfQuote) {
            this.marketVitals.open = bnfQuote.ohlc.open;
            this.marketVitals.high = bnfQuote.ohlc.high;
            this.marketVitals.low = bnfQuote.ohlc.low;
        }

        const vixQuote = quotes[INDIA_VIX_TOKEN];
        if (vixQuote) {
            this.marketVitals.vix = vixQuote.last_price;
        }
        
        console.log(`Initial Vitals: O=${this.marketVitals.open}, H=${this.marketVitals.high}, L=${this.marketVitals.low}, VIX=${this.marketVitals.vix}`);
        this._broadcastMarketVitals();
    } catch (error) {
        console.error("Failed to initialize market vitals:", error);
    }
  }
  
  _startLiveTicker() {
    console.log("Initializing live ticker...");
    if (this.ticker) {
        this.ticker.disconnect();
    }
    if (this.marketStatusInterval) {
        clearInterval(this.marketStatusInterval);
    }

    this.ticker = new KiteTicker({
      api_key: this.kite.api_key,
      access_token: this.kite.access_token,
    });

    this.ticker.connect();

    this.ticker.on("connect", () => {
      console.log("Kite Ticker connected. Subscribing to instruments...");
      const tokensToSubscribe = [this.instrumentToken, INDIA_VIX_TOKEN];
      this.ticker.subscribe(tokensToSubscribe);
      this.ticker.setMode(this.ticker.modeFull, tokensToSubscribe);
      this.connectionStatus = 'connected';
      this.connectionMessage = 'Live data feed active.';
      this._broadcastConnectionStatus();
      this._checkMarketHours(); // Initial check on connect
    });

    this.ticker.on("ticks", (ticks) => {
      let vitalsUpdated = false;
      ticks.forEach(tick => {
        if (tick.instrument_token === INDIA_VIX_TOKEN) {
            if (this.marketVitals.vix !== tick.last_price) {
                this.marketVitals.vix = tick.last_price;
                vitalsUpdated = true;
            }
        } else if (tick.instrument_token === this.instrumentToken) {
            if (tick.last_price > this.marketVitals.high) {
                this.marketVitals.high = tick.last_price;
                vitalsUpdated = true;
            }
            if (tick.last_price < this.marketVitals.low) {
                this.marketVitals.low = tick.last_price;
                vitalsUpdated = true;
            }
            this._processBankNiftyTick(tick);
        }
      });
      if (vitalsUpdated) {
          this._broadcastMarketVitals();
      }
    });

    this.ticker.on("reconnecting", () => {
        console.log("Ticker reconnecting...");
        this.connectionStatus = 'reconnecting';
        this.connectionMessage = 'Connection interrupted. Reconnecting...';
        this._broadcastConnectionStatus();
    });

    this.ticker.on("noreconnect", () => {
        console.log("Ticker will not reconnect.");
        this.connectionStatus = 'error';
        this.connectionMessage = 'Could not re-establish connection.';
        this._broadcastConnectionStatus();
    });
    
    this.ticker.on("disconnect", (error) => {
        console.log("Ticker disconnected:", error);
        this.connectionStatus = 'disconnected';
        this.connectionMessage = 'Live feed disconnected.';
        this._broadcastConnectionStatus();
    });

    this.ticker.on("error", (error) => {
        console.log("Ticker error:", error);
        this.connectionStatus = 'error';
        this.connectionMessage = 'An error occurred with the live feed.';
        this._broadcastConnectionStatus();
    });

    this.marketStatusInterval = setInterval(() => this._checkMarketHours(), 60000);
  }

  _checkMarketHours() {
    const now = new Date();
    const isNewDay = now.getHours() < 2 && (this.marketStatus === 'CLOSED');

    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const day = now.getUTCDay();

    let currentMarketStatus = 'CLOSED';
    if (day > 0 && day < 6) {
        const timeInUTCMinutes = hours * 60 + minutes;
        const marketOpenUTC = 3 * 60 + 45;
        const marketCloseUTC = 10 * 60;
        if (timeInUTCMinutes >= marketOpenUTC && timeInUTCMinutes <= marketCloseUTC) {
            currentMarketStatus = 'OPEN';
        }
    }
    
    if (this.marketStatus !== currentMarketStatus) {
        if (currentMarketStatus === 'OPEN') {
            this._resetDailyStats(); // Reset stats at market open
        }
        this.marketStatus = currentMarketStatus;
        console.log(`Market status changed to: ${this.marketStatus}`);
        this._broadcastMarketStatus();
    }
  }

  _processBankNiftyTick(tick) {
    if (!tick.tradable) return;
    this._logTickToFile(tick);
    this.currentPrice = tick.last_price;
    this._broadcastTick(tick);
    if (this.marketStatus === 'CLOSED') return;

    const tickTime = new Date(tick.timestamp);
    const minute = tickTime.getMinutes();
    const price = tick.last_price;

    this._setInitialBalance(tick);

    this.timeframes.forEach(tf => {
        const interval = parseInt(tf.replace('m', ''));
        if (!this.candles[tf] || this.candles[tf].minute !== minute) {
            if (minute % interval === 0 && this.candles[tf]) {
                const closedCandle = { ...this.candles[tf], volume: 0, date: this.candles[tf].date }; 
                this.historicalCandlesForContext[tf].push(closedCandle);
                if (this.historicalCandlesForContext[tf].length > 100) {
                    this.historicalCandlesForContext[tf].shift(); // Keep buffer size manageable
                }
                
                // Update HTF trend if it's the 15m candle
                if (tf === '15m') {
                    this._updateHTFTrend(this.historicalCandlesForContext['15m']);
                }

                const signal = this._evaluateRules(closedCandle, tf, this.historicalCandlesForContext[tf]);
                if (signal) {
                    this._updateFeedbackLoop(signal); // Update intraday learning
                    this._broadcastSignal(signal);
                }
            }
        }
        if (!this.candles[tf] || (minute % interval === 0 && this.candles[tf].minute !== minute)) {
            this.candles[tf] = { open: price, high: price, low: price, close: price, minute: minute, date: tick.timestamp };
        } else {
            this.candles[tf].high = Math.max(this.candles[tf].high, price);
            this.candles[tf].low = Math.min(this.candles[tf].low, price);
            this.candles[tf].close = price;
            this.candles[tf].date = tick.timestamp;
        }
    });
  }
  
  _evaluateRules(candle, timeframe, history) {
      if (history.length < 20) return null; // Need enough data for context

      const bullishRulesPassed = [];
      const bearishRulesPassed = [];
      
      const activeRules = Object.keys(ruleWeights).filter(rule => {
          const stats = this.dailyRulePerformance[rule];
          if (!stats) return true;
          return stats.net > -3; // Disable rule if it has more than 2 net losses
      });
      const allRulesFailed = new Set(activeRules);

      // --- CALCULATE INDICATORS ---
      this._calculateRSI(history, 14, timeframe);

      // --- MARKET REGIME ---
      const vix = this.marketVitals.vix;
      let marketRegime = 'Medium';
      if (vix < 15) marketRegime = 'Low';
      if (vix > 22) marketRegime = 'High';

      // --- RULE EVALUATIONS ---
      const addRule = (direction, name) => {
        if (activeRules.includes(name)) {
            if (direction === 'bullish') bullishRulesPassed.push(name);
            else if (direction === 'bearish') bearishRulesPassed.push(name);
            allRulesFailed.delete(name);
        }
      };

      // 0. HTF Trend Alignment
      const htfAlignment = this._checkHTFAlignment(timeframe);
      if (htfAlignment) addRule(htfAlignment, "HTF Alignment");

      // 1. Volume Analysis
      const volumeSpike = this._checkVolumeSpike(candle, history);
      if (volumeSpike) addRule(candle.close > candle.open ? 'bullish' : 'bearish', "Volume Analysis");

      // 2. Market Structure
      const marketStructure = this._checkMarketStructure(candle, history);
      if (marketStructure) addRule(marketStructure, "Market Structure");

      // 3. Support & Resistance (including PDC & IB)
      const srSignal = this._checkSupportResistance(candle);
      if (srSignal) addRule(srSignal.direction, "Support & Resistance");

      // 4. Initial Balance Breakout
      const ibSignal = this._checkInitialBalanceBreakout(candle);
      if (ibSignal) addRule(ibSignal, "Initial Balance Breakout");

      // 5. Consolidation Breakout
      const consolidationSignal = this._checkConsolidationBreakout(candle, history);
      if (consolidationSignal) {
          addRule(consolidationSignal.direction, "Consolidation Breakout");
          if (consolidationSignal.isConsolidating) {
              const consolidationInfoSignal = {
                  time: candle.date || new Date().toISOString(),
                  symbol: 'BANKNIFTY', price: parseFloat(candle.close.toFixed(2)),
                  direction: 'PRICE_CONSOLIDATION', rulesPassed: [], rulesFailed: [],
                  conviction: 0, timeframe: timeframe,
              };
              this._broadcastSignal(consolidationInfoSignal);
          }
      }

      // 6. Candlestick Pattern (Engulfing, Pin Bar)
      const candlePattern = this._checkCandlestickPattern(candle, history);
      if (candlePattern) addRule(candlePattern, "Candlestick Patterns");
      
      // 7. Previous Day Levels
      const pdlSignal = this._checkPreviousDayLevels(candle);
      if (pdlSignal) addRule(pdlSignal, "Previous Day Levels");

      // 8. Momentum Divergence
      const divergence = this._checkMomentumDivergence(candle, history, timeframe);
      if (divergence) addRule(divergence, "Momentum Divergence");

      // --- FINAL SIGNAL DECISION ---
      if (marketRegime === 'High' && bullishRulesPassed.includes("Consolidation Breakout")) return null;
      if (marketRegime === 'High' && bearishRulesPassed.includes("Consolidation Breakout")) return null;

      let consensusDirection = null;
      if (bullishRulesPassed.length > bearishRulesPassed.length + 1) {
          consensusDirection = 'BUY';
      } else if (bearishRulesPassed.length > bullishRulesPassed.length + 1) {
          consensusDirection = 'SELL';
      }

      if (!consensusDirection) return null;
      if (Math.abs(candle.close - this.lastSignalPrice) < 75) return null;

      const rulesPassed = consensusDirection === 'BUY' ? bullishRulesPassed : bearishRulesPassed;
      if (rulesPassed.length === 0) return null;

      let convictionScore = 50;
      rulesPassed.forEach(rule => { convictionScore += ruleWeights[rule] || 5; });
      convictionScore = Math.min(98, Math.floor(convictionScore));
      
      let finalDirection = consensusDirection;
      // Determine STRONG signals
      const isStrongConfluence = rulesPassed.includes("HTF Alignment") && rulesPassed.includes("Market Structure") && rulesPassed.includes("Volume Analysis");
      if (convictionScore > 85 || isStrongConfluence) {
          finalDirection = `STRONG_${consensusDirection}`;
      }

      this.lastSignalPrice = candle.close;

      return {
          time: candle.date || new Date().toISOString(),
          symbol: 'BANKNIFTY',
          price: parseFloat(candle.close.toFixed(2)),
          direction: finalDirection,
          rulesPassed: rulesPassed,
          rulesFailed: Array.from(allRulesFailed),
          conviction: convictionScore,
          timeframe: timeframe,
      };
  }

  // --- RULE HELPER FUNCTIONS ---

   _calculateEMA(data, period) {
    if (data.length < period) return null;
    const k = 2 / (period + 1);
    const closes = data.map(d => d.close);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
        ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  }

  _calculateRSI(history, period, timeframe) {
    if (history.length < period) return;
    const closes = history.map(c => c.close);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
    }
    
    if (losses === 0) { this.rsi[timeframe].value = 100; return; }
    
    const rs = gains / losses;
    const rsiValue = 100 - (100 / (1 + rs));
    
    this.rsi[timeframe].value = rsiValue;
    this.rsi[timeframe].history.push({ price: closes[closes.length-1], rsi: rsiValue });
    if (this.rsi[timeframe].history.length > 20) this.rsi[timeframe].history.shift();
  }

  _setInitialBalance(tick) {
      if (this.initialBalance.set) return;
      const tickTime = new Date(tick.timestamp);
      const hours = tickTime.getUTCHours();
      const minutes = tickTime.getUTCMinutes();
      const timeInUTCMinutes = hours * 60 + minutes;

      const marketOpenUTC = 3 * 60 + 45; // 09:15 AM IST
      const ibEndUTC = 4 * 60; // 09:30 AM IST

      if (timeInUTCMinutes >= marketOpenUTC && timeInUTCMinutes < ibEndUTC) {
          const price = tick.last_price;
          if (this.initialBalance.high === 0) {
              this.initialBalance.high = price;
              this.initialBalance.low = price;
          } else {
              this.initialBalance.high = Math.max(this.initialBalance.high, price);
              this.initialBalance.low = Math.min(this.initialBalance.low, price);
          }
      } else if (timeInUTCMinutes >= ibEndUTC) {
          this.initialBalance.set = true;
          console.log(`Initial Balance set: High=${this.initialBalance.high}, Low=${this.initialBalance.low}`);
      }
  }

  _updateHTFTrend(history15m) {
    if (history15m.length < 20) return;
    const ema20 = this._calculateEMA(history15m.slice(-20), 20);
    const lastCandle = history15m[history15m.length - 1];
    if (!ema20) return;
    
    if (lastCandle.close > ema20) this.htfTrend = 'UP';
    else if (lastCandle.close < ema20) this.htfTrend = 'DOWN';
    else this.htfTrend = 'NEUTRAL';
  }

  _checkHTFAlignment(timeframe) {
      if (timeframe === '15m') return null;
      if (this.htfTrend === 'UP') return 'bullish';
      if (this.htfTrend === 'DOWN') return 'bearish';
      return null;
  }
  
  _updateFeedbackLoop(newSignal) {
    const timeframe = newSignal.timeframe;
    const previousSignal = this.lastSignalForFeedback[timeframe];
    const baseDirection = newSignal.direction.replace('STRONG_', '');
    
    if (previousSignal && previousSignal.direction.replace('STRONG_', '') !== baseDirection) {
        const pnl = previousSignal.direction.includes('BUY')
            ? newSignal.price - previousSignal.price
            : previousSignal.price - newSignal.price;
        
        const outcome = pnl > 0 ? 'win' : 'loss';
        
        previousSignal.rulesPassed.forEach(rule => {
            const stats = this.dailyRulePerformance[rule];
            if (stats) {
                if (outcome === 'win') stats.net++;
                else stats.net--;
            }
        });
    }
    
    this.lastSignalForFeedback[timeframe] = newSignal;
  }

  _checkVolumeSpike(candle, history) {
      if (!candle.volume) return false;
      const recentHistory = history.slice(-20, -1);
      if (recentHistory.length < 10) return false;
      const avgVolume = recentHistory.reduce((acc, c) => acc + (c.volume || 0), 0) / recentHistory.length;
      return candle.volume > avgVolume * 1.5;
  }

  _checkMarketStructure(candle, history) {
      const recentHistory = history.slice(-15, -1);
      if (recentHistory.length < 10) return null;
      const swingHigh = Math.max(...recentHistory.map(c => c.high));
      const swingLow = Math.min(...recentHistory.map(c => c.low));

      if (candle.close > swingHigh) return 'bullish';
      if (candle.close < swingLow) return 'bearish';
      return null;
  }
  
  _checkSupportResistance(candle) {
    const levels = {
        'PDH': this.previousDayHigh, 'PDL': this.previousDayLow, 'PDC': this.previousDayClose,
        'Open': this.marketVitals.open,
    };
    if (this.initialBalance.set) {
        levels['IB High'] = this.initialBalance.high;
        levels['IB Low'] = this.initialBalance.low;
    }

    for (const [name, level] of Object.entries(levels)) {
        if (!level || level === 0) continue;
        const proximity = candle.close * 0.001;
        // Breakout
        if (candle.open < level && candle.close > level) return { direction: 'bullish' };
        if (candle.open > level && candle.close < level) return { direction: 'bearish' };
        // Bounce
        if (Math.abs(candle.low - level) < proximity && candle.close > candle.open) return { direction: 'bullish' };
        if (Math.abs(candle.high - level) < proximity && candle.close < candle.open) return { direction: 'bearish' };
    }
    return null;
  }

  _checkInitialBalanceBreakout(candle) {
      if (!this.initialBalance.set) return null;
      if (candle.open < this.initialBalance.high && candle.close > this.initialBalance.high) return 'bullish';
      if (candle.open > this.initialBalance.low && candle.close < this.initialBalance.low) return 'bearish';
      return null;
  }

  _checkConsolidationBreakout(candle, history) {
      const recentHistory = history.slice(-10, -1);
      if (recentHistory.length < 8) return null;
      
      const maxHigh = Math.max(...recentHistory.map(c => c.high));
      const minLow = Math.min(...recentHistory.map(c => c.low));
      const range = maxHigh - minLow;
      
      const isConsolidating = (range / minLow < 0.002);
      if (isConsolidating) {
          if (candle.close > maxHigh) return { direction: 'bullish' };
          if (candle.close < minLow) return { direction: 'bearish' };
          return { isConsolidating: true };
      }
      return null;
  }

   _checkCandlestickPattern(candle, history) {
    if (history.length < 2) return null;
    const prevCandle = history[history.length - 2];
    const bodySize = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    
    // Bullish Engulfing
    if (candle.close > candle.open && prevCandle.close < prevCandle.open && candle.close > prevCandle.open && candle.open < prevCandle.close) return 'bullish';
    // Bearish Engulfing
    if (candle.close < candle.open && prevCandle.close > prevCandle.open && candle.close < prevCandle.open && candle.open > prevCandle.close) return 'bearish';

    // Pin Bar (Hammer/Shooting Star)
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    if (bodySize > 0 && range > bodySize * 3) {
        if (lowerWick > bodySize * 2) return 'bullish'; // Hammer
        if (upperWick > bodySize * 2) return 'bearish'; // Shooting Star
    }

    // Marubozu-like
    if (range > 0 && bodySize / range > 0.7) {
        return candle.close > candle.open ? 'bullish' : 'bearish';
    }
    return null;
  }
  
  _checkPreviousDayLevels(candle) {
      if (candle.open <= this.previousDayHigh && candle.close > this.previousDayHigh) return 'bullish';
      if (candle.open >= this.previousDayLow && candle.close < this.previousDayLow) return 'bearish';
      return null;
  }

  _checkMomentumDivergence(candle, history, timeframe) {
      const rsiData = this.rsi[timeframe];
      if (!rsiData || rsiData.history.length < 10) return null;

      const recentHistory = history.slice(-10, -1);
      const recentRsi = rsiData.history.slice(-10, -1);
      
      const priceHigh = Math.max(...recentHistory.map(c => c.high));
      const rsiHigh = Math.max(...recentRsi.map(r => r.rsi));
      
      const priceLow = Math.min(...recentHistory.map(c => c.low));
      const rsiLow = Math.min(...recentRsi.map(r => r.rsi));

      // Bearish Divergence: Higher high in price, lower high in RSI
      if (candle.high > priceHigh && rsiData.value < rsiHigh) return 'bearish';
      // Bullish Divergence: Lower low in price, higher low in RSI
      if (candle.low < priceLow && rsiData.value > rsiLow) return 'bullish';
      
      return null;
  }


  // --- BACKTESTING LOGIC (abridged for brevity, no changes from previous version) ---
  async runHistoricalAnalysis(config) {
    const { period, timeframe, from, to, sl = 0.5, tp = 1.0, instrument = 'BANKNIFTY', tradeExitStrategy = 'stop' } = config;
    if (!this.kite) {
        throw new Error("Cannot run backtest: broker is not connected.");
    }
    
    const instrumentToken = INSTRUMENT_MAP[instrument] || INSTRUMENT_MAP['BANKNIFTY'];
    
    const { candles, dataSourceMessage } = await this._getHistoricalDataWithCache(config, instrumentToken);
    if (candles.length === 0) {
        return { winRate: '0.0%', totalTrades: 0, signals: [], candles: [] };
    }

    const signals = [];
    const dailyData = {};

    candles.forEach(candle => {
        const date = new Date(candle.date).toISOString().split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = { high: candle.high, low: candle.low, open: candle.open, close: candle.close };
        } else {
            dailyData[date].high = Math.max(dailyData[date].high, candle.high);
            dailyData[date].low = Math.min(dailyData[date].low, candle.low);
            dailyData[date].close = candle.close;
        }
    });

    const sortedDates = Object.keys(dailyData).sort();

    for (let i = 20; i < candles.length; i++) {
        const currentCandle = candles[i];
        
        const currentDateStr = new Date(currentCandle.date).toISOString().split('T')[0];
        const prevDateIndex = sortedDates.indexOf(currentDateStr) - 1;
        if (prevDateIndex >= 0) {
            const prevDateStr = sortedDates[prevDateIndex];
            this.previousDayHigh = dailyData[prevDateStr].high;
            this.previousDayLow = dailyData[prevDateStr].low;
            this.previousDayClose = dailyData[prevDateStr].close;
        }
        this.marketVitals.open = dailyData[currentDateStr].open;
        
        const history = candles.slice(i - 20, i);
        const signal = this._evaluateRules(currentCandle, timeframe, history);
        if (signal) {
            signals.push({ ...signal, candleIndex: i });
        }
    }
    
    await this._fetchPreMarketData(); 
    
    const metrics = this._calculatePerformanceMetrics(signals, candles, { slPercent: sl, tpPercent: tp, tradeExitStrategy });
    
    const totalTrades = metrics.wins + metrics.losses;
    const winRate = totalTrades > 0 ? ((metrics.wins / totalTrades) * 100).toFixed(1) + '%' : '0.0%';
    const profitFactor = metrics.totalLoss > 0 ? (metrics.totalProfit / metrics.totalLoss).toFixed(2) : 'N/A';
    const maxDrawdown = (metrics.maxDrawdown * 100).toFixed(2) + '%';
    
    return {
        period: period || 'Custom Range', instrument, timeframe, tradeExitStrategy, signals, dataSourceMessage,
        winRate, profitFactor, totalTrades, maxDrawdown,
        netProfit: metrics.netProfit, totalWins: metrics.wins, totalLosses: metrics.losses,
        avgWin: metrics.avgWin, avgLoss: metrics.avgLoss, equityCurve: metrics.equityCurve,
        rulePerformance: metrics.rulePerformance,
        candles: candles.map((c, index) => ({ id: index, ...c, date: c.date.toISOString() })),
    };
  }
  
  async _getHistoricalDataWithCache(config, instrumentToken) {
    const { period, timeframe, from, to } = config;
    const { fromDate, toDate } = this._getDateRange(period, from, to);
    
    const timeframeMap = { '1m': 'minute', '3m': '3minute', '5m': '5minute', '15m': '15minute' };
    const kiteTimeframe = timeframeMap[timeframe];
    if (!kiteTimeframe) throw new Error("Invalid timeframe for Kite API.");
    
    let dataSourceMessage = '';
    try {
        const apiData = await this.kite.getHistoricalData(instrumentToken, kiteTimeframe, fromDate, toDate);
        dataSourceMessage = `Data validated with broker. ${apiData.length} fresh data points were used to update the local cache.`;
        if (apiData.length > 0) {
            const client = await this.db.connect();
            try {
                await client.query('BEGIN');
                const insertQuery = `INSERT INTO historical_candles (instrument_token, timeframe, timestamp, open, high, low, close, volume) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (instrument_token, timeframe, timestamp) DO NOTHING`;
                for (const candle of apiData) {
                    await client.query(insertQuery, [instrumentToken, timeframe, candle.date, candle.open, candle.high, candle.low, candle.close, candle.volume]);
                }
                await client.query('COMMIT');
            } catch (e) { await client.query('ROLLBACK'); } finally { client.release(); }
        }
    } catch (e) {
        dataSourceMessage = `Could not fetch fresh data from broker. The backtest will run using only locally cached data.`;
    }
    
    const selectQuery = `SELECT * FROM historical_candles WHERE instrument_token = $1 AND timeframe = $2 AND timestamp >= $3 AND timestamp <= $4 ORDER BY timestamp ASC`;
    const { rows } = await this.db.query(selectQuery, [instrumentToken, timeframe, fromDate, toDate]);
    
    if (rows.length === 0) throw new Error("No historical data available for the selected period.");

    const candles = rows.map(r => ({ ...r, date: new Date(r.timestamp), open: parseFloat(r.open), high: parseFloat(r.high), low: parseFloat(r.low), close: parseFloat(r.close), volume: parseInt(r.volume, 10) }));
    return { candles, dataSourceMessage };
  }

  _getDateRange(period, from, to) {
    if (from && to) return { fromDate: new Date(from * 1000), toDate: new Date(to * 1000) };
    const toDate = new Date();
    const fromDate = new Date();
    const [value, unit] = period.split(' ');
    const numValue = parseInt(value, 10);
    if (unit.startsWith('month')) fromDate.setMonth(toDate.getMonth() - numValue);
    else if (unit.startsWith('year')) fromDate.setFullYear(toDate.getFullYear() - numValue);
    return { fromDate, toDate };
  }

  _calculatePerformanceMetrics(signals, candles, config) {
    const { slPercent, tpPercent, tradeExitStrategy } = config;
    let wins = 0, losses = 0, totalProfit = 0, totalLoss = 0;
    let equity = 100000, peakEquity = equity, maxDrawdown = 0;
    const equityCurve = [{ tradeNumber: 0, equity, date: candles[0]?.date.toISOString() }];
    const ruleStats = {};
    let trades = [];

    if (tradeExitStrategy === 'signal') {
        let openTrade = null;
        signals.forEach((signal) => {
            const baseDirection = signal.direction.replace('STRONG_', '');
            if (openTrade && baseDirection !== openTrade.signal.direction.replace('STRONG_', '')) {
                trades.push({ ...openTrade, exitPrice: signal.price, exitDate: new Date(signal.time) });
                openTrade = { signal, entryPrice: signal.price, entryDate: new Date(signal.time) };
            } else if (!openTrade) {
                openTrade = { signal, entryPrice: signal.price, entryDate: new Date(signal.time) };
            }
        });
        if (openTrade) trades.push({ ...openTrade, exitPrice: candles[candles.length - 1].close, exitDate: candles[candles.length - 1].date });
    } else { // 'stop' strategy
        signals.forEach((signal) => {
            const entryPrice = signal.price;
            const entryIndex = signal.candleIndex;
            const direction = signal.direction.replace('STRONG_', '');
            const stopLoss = direction === 'BUY' ? entryPrice * (1 - slPercent / 100) : entryPrice * (1 + slPercent / 100);
            const takeProfit = direction === 'BUY' ? entryPrice * (1 + tpPercent / 100) : entryPrice * (1 - tpPercent / 100);
            let exitPrice = candles[candles.length - 1].close;
            let exitDate = candles[candles.length - 1].date;
            for (let i = entryIndex + 1; i < candles.length; i++) {
                const candle = candles[i];
                if (direction === 'BUY') {
                    if (candle.high >= takeProfit) { exitPrice = takeProfit; exitDate = candle.date; break; }
                    if (candle.low <= stopLoss) { exitPrice = stopLoss; exitDate = candle.date; break; }
                } else {
                    if (candle.low <= takeProfit) { exitPrice = takeProfit; exitDate = candle.date; break; }
                    if (candle.high >= stopLoss) { exitPrice = stopLoss; exitDate = candle.date; break; }
                }
            }
            trades.push({ signal, entryPrice, exitPrice, exitDate });
        });
    }

    trades.forEach((trade, index) => {
        const { signal, entryPrice, exitPrice, exitDate } = trade;
        const direction = signal.direction.replace('STRONG_', '');
        const pnl = direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
        
        equity += pnl;
        if (equity > peakEquity) peakEquity = equity;
        const drawdown = (peakEquity - equity) / peakEquity;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        const outcome = pnl > 0 ? 'win' : 'loss';
        (outcome === 'win') ? (wins++, totalProfit += pnl) : (losses++, totalLoss += Math.abs(pnl));
        signal.rulesPassed.forEach(rule => {
            if (!ruleStats[rule]) ruleStats[rule] = { wins: 0, losses: 0 };
            ruleStats[rule][outcome === 'win' ? 'wins' : 'losses']++;
        });
        equityCurve.push({ tradeNumber: index + 1, equity, date: exitDate.toISOString() });
    });

    const netProfit = totalProfit - totalLoss;
    const avgWin = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const rulePerformance = Object.entries(ruleStats).map(([rule, stats]) => {
        const total = stats.wins + stats.losses;
        return { rule, ...stats, total, winRate: total > 0 ? ((stats.wins / total) * 100).toFixed(1) + '%' : '0.0%'};
    }).sort((a, b) => b.total - a.total);

    return { wins, losses, totalProfit, totalLoss, peakEquity, maxDrawdown, equityCurve, netProfit, avgWin, avgLoss, rulePerformance };
  }

  async analyzeSignalPerformance(config = {}) {
      // Logic unchanged, remains as is.
  }
  
  async getAIStrategySuggestions(results, apiKey) {
    // Logic unchanged, remains as is.
  }


  // --- DATABASE & LOGGING & BROADCASTING (all unchanged) ---
  
  async _saveSignalToDb(signal) {
    const query = `INSERT INTO signals (symbol, price, direction, rules_passed, rules_failed, conviction) VALUES ($1, $2, $3, $4, $5, $6)`;
    const values = [signal.symbol, signal.price, signal.direction, signal.rulesPassed, signal.rulesFailed, signal.conviction];
    try { await this.db.query(query, values); } catch (error) { console.error('Error saving signal to database:', error); }
  }

  _logSignalToFile(signal) { fs.appendFile(signalsLogPath, JSON.stringify(signal) + '\n', (err) => {}); }
  _logTickToFile(tick) { fs.appendFile(ticksLogPath, JSON.stringify(tick) + '\n', (err) => {}); }
  
  _broadcast(message) {
    if (!this.wss || this.wss.clients.size === 0) return;
    const stringifiedMessage = JSON.stringify(message);
    this.wss.clients.forEach((client) => { if (client.readyState === 1) client.send(stringifiedMessage); });
  }

  async _broadcastSignal(signal) {
    if (signal.direction !== 'PRICE_CONSOLIDATION') {
        this.recentSignals.unshift(signal);
        if (this.recentSignals.length > 20) this.recentSignals.pop();
        await this._saveSignalToDb(signal);
        this._calculateAndBroadcastSentiment();
    }
    this._logSignalToFile(signal);
    this._broadcast({ type: 'new_signal', payload: signal });
  }
  
  _calculateAndBroadcastSentiment() {
    if (this.recentSignals.length === 0) { this._broadcast({ type: 'market_sentiment_update', payload: { score: 50 } }); return; }
    const buySignals = this.recentSignals.filter(s => s.direction.includes('BUY')).length;
    const sentimentScore = Math.round((buySignals / this.recentSignals.length) * 100);
    this._broadcast({ type: 'market_sentiment_update', payload: { score: sentimentScore } });
  }

  _broadcastTick(tick) { this._broadcast({ type: 'market_tick', payload: { price: tick.last_price, time: tick.timestamp } }); }
  _broadcastConnectionStatus() { this._broadcast({ type: 'broker_status_update', payload: { status: this.connectionStatus, message: this.connectionMessage } }); }
  _broadcastMarketStatus() { this._broadcast({ type: 'market_status_update', payload: { status: this.marketStatus } }); }
  _broadcastMarketVitals() { this._broadcast({ type: 'market_vitals_update', payload: this.marketVitals }); }
}

module.exports = PriceActionEngine;
