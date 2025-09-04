const { GoogleGenAI } = require("@google/genai");
const { KiteConnect } = require("kiteconnect");
const { KiteTicker } = require("kiteconnect");
const fs = require('fs');
const path = require('path');
const signalsLogPath = path.join(__dirname, 'data', 'signals.log');
const ticksLogPath = path.join(__dirname, 'data', 'ticks.log');


const ruleWeights = {
    "HTF Alignment": 20, // New rule with high weight
    "Breakout & Retest": 15,
    "Market Structure": 10,
    "Volume Analysis": 8,
    "Support & Resistance": 12,
    "Candlestick Patterns": 5,
    "Consolidation Breakout": 14,
    "Previous Day Levels": 7
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
    this.timeframes.forEach(tf => this.lastSignalForFeedback[tf] = null);
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
    this.timeframes.forEach(tf => this.lastSignalForFeedback[tf] = null);
    this.htfTrend = 'NEUTRAL';
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
      console.log(`Pre-market data loaded: PDH=${this.previousDayHigh}, PDL=${this.previousDayLow}`);
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
      
      // Filter out disabled rules based on intraday performance
      const activeRules = Object.keys(ruleWeights).filter(rule => {
          const stats = this.dailyRulePerformance[rule];
          if (!stats) return true;
          // Disable rule if it has more than 2 net losses for the day
          return stats.net > -3;
      });
      const allRulesFailed = new Set(activeRules);


      // --- MARKET REGIME FILTER ---
      const vix = this.marketVitals.vix;
      let marketRegime = 'Medium'; // Default
      if (vix < 15) marketRegime = 'Low';
      if (vix > 22) marketRegime = 'High';

      // --- RULE EVALUATIONS ---
      
      // 0. HTF Trend Alignment (New Rule)
      const htfAlignment = this._checkHTFAlignment(timeframe);
      if (htfAlignment === 'bullish') {
          bullishRulesPassed.push("HTF Alignment");
          allRulesFailed.delete("HTF Alignment");
      } else if (htfAlignment === 'bearish') {
          bearishRulesPassed.push("HTF Alignment");
          allRulesFailed.delete("HTF Alignment");
      }
      
      // 1. Volume Analysis
      if (activeRules.includes("Volume Analysis") && this._checkVolumeSpike(candle, history)) {
          if (candle.close > candle.open) bullishRulesPassed.push("Volume Analysis");
          else bearishRulesPassed.push("Volume Analysis");
          allRulesFailed.delete("Volume Analysis");
      }

      // 2. Market Structure
      if (activeRules.includes("Market Structure")) {
          const marketStructure = this._checkMarketStructure(candle, history);
          if (marketStructure === 'bullish') {
              bullishRulesPassed.push("Market Structure");
              allRulesFailed.delete("Market Structure");
          } else if (marketStructure === 'bearish') {
              bearishRulesPassed.push("Market Structure");
              allRulesFailed.delete("Market Structure");
          }
      }

      // 3. Support & Resistance
      if (activeRules.includes("Support & Resistance")) {
          const srSignal = this._checkSupportResistance(candle);
          if (srSignal) {
              if (srSignal.direction === 'bullish') bullishRulesPassed.push(srSignal.rule);
              else bearishRulesPassed.push(srSignal.rule);
              allRulesFailed.delete(srSignal.rule);
          }
      }

      // 4. Consolidation Breakout
      if (activeRules.includes("Consolidation Breakout")) {
          const consolidationSignal = this._checkConsolidationBreakout(candle, history);
          if (consolidationSignal === 'bullish') {
              bullishRulesPassed.push("Consolidation Breakout");
              allRulesFailed.delete("Consolidation Breakout");
          } else if (consolidationSignal === 'bearish') {
              bearishRulesPassed.push("Consolidation Breakout");
              allRulesFailed.delete("Consolidation Breakout");
          }
      }
      
      // 5. Candlestick Pattern
      if (activeRules.includes("Candlestick Patterns")) {
          const candlePattern = this._checkCandlestickPattern(candle);
          if (candlePattern === 'bullish') {
              bullishRulesPassed.push("Candlestick Patterns");
              allRulesFailed.delete("Candlestick Patterns");
          } else if (candlePattern === 'bearish') {
              bearishRulesPassed.push("Candlestick Patterns");
              allRulesFailed.delete("Candlestick Patterns");
          }
      }

      // 6. Previous Day Levels
      if (activeRules.includes("Previous Day Levels")) {
          const pdlSignal = this._checkPreviousDayLevels(candle);
          if (pdlSignal === 'bullish') {
              bullishRulesPassed.push("Previous Day Levels");
              allRulesFailed.delete("Previous Day Levels");
          } else if (pdlSignal === 'bearish') {
              bearishRulesPassed.push("Previous Day Levels");
              allRulesFailed.delete("Previous Day Levels");
          }
      }

      // --- FINAL SIGNAL DECISION ---
      if (marketRegime === 'High' && (bullishRulesPassed.includes("Consolidation Breakout") || bearishRulesPassed.includes("Consolidation Breakout"))) {
          return null; 
      }

      let direction = null;
      if (bullishRulesPassed.length > 0 && bullishRulesPassed.length >= bearishRulesPassed.length + 1) {
          direction = 'BUY';
      } else if (bearishRulesPassed.length > 0 && bearishRulesPassed.length >= bearishRulesPassed.length + 1) {
          direction = 'SELL';
      }

      if (!direction) return null;
      
      if (Math.abs(candle.close - this.lastSignalPrice) < 75) return null;

      const rulesPassed = direction === 'BUY' ? bullishRulesPassed : bearishRulesPassed;
      if (rulesPassed.length === 0) return null;

      let convictionScore = 50;
      rulesPassed.forEach(rule => { convictionScore += ruleWeights[rule] || 5; });
      convictionScore = Math.min(98, Math.floor(convictionScore));
      this.lastSignalPrice = candle.close;

      return {
          time: candle.date || new Date().toISOString(),
          symbol: 'BANKNIFTY',
          price: parseFloat(candle.close.toFixed(2)),
          direction: direction,
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
    let ema = data[0].close;
    for (let i = 1; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k);
    }
    return ema;
  }

  _updateHTFTrend(history15m) {
    if (history15m.length < 20) return;
    const ema20 = this._calculateEMA(history15m.slice(-20), 20);
    const lastCandle = history15m[history15m.length - 1];
    if (!ema20) return;
    
    if (lastCandle.close > ema20) this.htfTrend = 'UP';
    else if (lastCandle.close < ema20) this.htfTrend = 'DOWN';
    else this.htfTrend = 'NEUTRAL';
    console.log(`Updated 15m HTF Trend to: ${this.htfTrend}`);
  }

  _checkHTFAlignment(timeframe) {
      if (timeframe === '15m') return null; // Don't apply to itself
      if (this.htfTrend === 'UP') return 'bullish';
      if (this.htfTrend === 'DOWN') return 'bearish';
      return null;
  }
  
  _updateFeedbackLoop(newSignal) {
    const timeframe = newSignal.timeframe;
    const previousSignal = this.lastSignalForFeedback[timeframe];
    
    // If there was a previous signal and the new one is opposite, a "trade" has closed.
    if (previousSignal && previousSignal.direction !== newSignal.direction) {
        const pnl = previousSignal.direction === 'BUY'
            ? newSignal.price - previousSignal.price
            : previousSignal.price - newSignal.price;
        
        const outcome = pnl > 0 ? 'win' : 'loss';
        
        // Update performance for each rule that generated the *previous* signal
        previousSignal.rulesPassed.forEach(rule => {
            const stats = this.dailyRulePerformance[rule];
            if (outcome === 'win') {
                stats.wins++;
                stats.net++;
            } else {
                stats.losses++;
                stats.net--;
            }
        });
        console.log(`Feedback Loop (${timeframe}): ${previousSignal.direction} signal closed. Outcome: ${outcome}. PnL: ${pnl.toFixed(2)}.`);
    }
    
    // Store the new signal as the latest for this timeframe
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
        'PDH': this.previousDayHigh,
        'PDL': this.previousDayLow,
        'Open': this.marketVitals.open,
    };
    const proximity = candle.close * 0.001;

    for (const [name, level] of Object.entries(levels)) {
        if (candle.open < level && candle.close > level) return { rule: 'Support & Resistance', direction: 'bullish' };
        if (candle.open > level && candle.close < level) return { rule: 'Support & Resistance', direction: 'bearish' };
        if (Math.abs(candle.low - level) < proximity && candle.close > candle.open) return { rule: 'Support & Resistance', direction: 'bullish' };
        if (Math.abs(candle.high - level) < proximity && candle.close < candle.open) return { rule: 'Support & Resistance', direction: 'bearish' };
    }
    return null;
  }

  _checkConsolidationBreakout(candle, history) {
      const recentHistory = history.slice(-10, -1);
      if (recentHistory.length < 8) return null;
      
      const maxHigh = Math.max(...recentHistory.map(c => c.high));
      const minLow = Math.min(...recentHistory.map(c => c.low));
      const range = maxHigh - minLow;

      if (range / minLow < 0.002) {
          if (candle.close > maxHigh) return 'bullish';
          if (candle.close < minLow) return 'bearish';
      }
      return null;
  }

   _checkCandlestickPattern(candle) {
    const bodySize = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
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


  // --- BACKTESTING LOGIC ---

  async runHistoricalAnalysis(config) {
    const { period, timeframe, from, to, sl = 0.5, tp = 1.0, instrument = 'BANKNIFTY', tradeExitStrategy = 'stop' } = config;
    if (!this.kite) {
        throw new Error("Cannot run backtest: broker is not connected.");
    }
    
    const instrumentToken = INSTRUMENT_MAP[instrument] || INSTRUMENT_MAP['BANKNIFTY'];
    console.log(`Running historical analysis for ${instrument} (${instrumentToken}) for ${period || 'custom range'} on ${timeframe} timeframe...`);
    
    const { candles, dataSourceMessage } = await this._getHistoricalDataWithCache(config, instrumentToken);
    if (candles.length === 0) {
        return { winRate: '0.0%', totalTrades: 0, signals: [], candles: [] };
    }

    const signals = [];
    const dailyData = {}; // To store PDH/PDL for each day

    // Pre-calculate daily levels
    candles.forEach(candle => {
        const date = new Date(candle.date).toISOString().split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = { high: candle.high, low: candle.low };
        } else {
            dailyData[date].high = Math.max(dailyData[date].high, candle.high);
            dailyData[date].low = Math.min(dailyData[date].low, candle.low);
        }
    });

    const sortedDates = Object.keys(dailyData).sort();

    for (let i = 20; i < candles.length; i++) {
        const currentCandle = candles[i];
        
        // Set daily context
        const currentDateStr = new Date(currentCandle.date).toISOString().split('T')[0];
        const prevDateIndex = sortedDates.indexOf(currentDateStr) - 1;
        if (prevDateIndex >= 0) {
            const prevDateStr = sortedDates[prevDateIndex];
            this.previousDayHigh = dailyData[prevDateStr].high;
            this.previousDayLow = dailyData[prevDateStr].low;
        }

        this.marketVitals.open = candles.find(c => new Date(c.date).toISOString().split('T')[0] === currentDateStr)?.open || currentCandle.open;
        
        const history = candles.slice(i - 20, i);
        const signal = this._evaluateRules(currentCandle, timeframe, history);
        if (signal) {
            signals.push({ ...signal, candleIndex: i });
        }
    }
    
    await this._fetchPreMarketData(); 
    
    console.log(`Backtest found ${signals.length} signals over ${candles.length} candles.`);
    
    const metrics = this._calculatePerformanceMetrics(signals, candles, { slPercent: sl, tpPercent: tp, tradeExitStrategy });
    
    const totalTrades = metrics.wins + metrics.losses;
    const winRate = totalTrades > 0 ? ((metrics.wins / totalTrades) * 100).toFixed(1) + '%' : '0.0%';
    const profitFactor = metrics.totalLoss > 0 ? (metrics.totalProfit / metrics.totalLoss).toFixed(2) : 'N/A';
    const maxDrawdown = (metrics.maxDrawdown * 100).toFixed(2) + '%';
    
    return {
        period: period || 'Custom Range',
        instrument,
        timeframe: timeframe,
        tradeExitStrategy,
        signals,
        dataSourceMessage,
        winRate,
        profitFactor,
        totalTrades,
        maxDrawdown,
        netProfit: metrics.netProfit,
        totalWins: metrics.wins,
        totalLosses: metrics.losses,
        avgWin: metrics.avgWin,
        avgLoss: metrics.avgLoss,
        equityCurve: metrics.equityCurve,
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

    console.log(`Ensuring local data is up-to-date for ${timeframe} from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    try {
        const apiData = await this.kite.getHistoricalData(instrumentToken, kiteTimeframe, fromDate, toDate);
        console.log(`Fetched ${apiData.length} candles from Kite API for validation and caching.`);
        dataSourceMessage = `Data validated with broker. ${apiData.length} fresh data points were used to update the local cache.`;

        if (apiData.length > 0) {
            const client = await this.db.connect();
            try {
                await client.query('BEGIN');
                const insertQuery = `
                    INSERT INTO historical_candles (instrument_token, timeframe, timestamp, open, high, low, close, volume)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (instrument_token, timeframe, timestamp) DO NOTHING
                `;
                for (const candle of apiData) {
                    await client.query(insertQuery, [instrumentToken, timeframe, candle.date, candle.open, candle.high, candle.low, candle.close, candle.volume]);
                }
                await client.query('COMMIT');
                console.log(`Successfully synced candles to local cache.`);
            } catch (e) {
                await client.query('ROLLBACK');
                console.error("Error caching historical data:", e);
            } finally {
                client.release();
            }
        }
    } catch (e) {
        console.error("Failed to fetch data from Kite API. Will proceed with locally cached data if available.", e.message);
        dataSourceMessage = `Could not fetch fresh data from broker. The backtest will run using only locally cached data.`;
    }
    
    console.log('Fetching complete dataset from local cache for analysis...');
    const selectQuery = `
        SELECT * FROM historical_candles
        WHERE instrument_token = $1 AND timeframe = $2 AND timestamp >= $3 AND timestamp <= $4
        ORDER BY timestamp ASC
    `;
    const { rows } = await this.db.query(selectQuery, [instrumentToken, timeframe, fromDate, toDate]);
    
    if (rows.length === 0) {
        console.log('No historical data found locally or from API for this period.');
        throw new Error("No historical data available for the selected period. Check broker connection and API limits.");
    }

    console.log(`Proceeding to analysis with ${rows.length} candles from local cache.`);
    const candles = rows.map(r => ({ ...r, date: new Date(r.timestamp), open: parseFloat(r.open), high: parseFloat(r.high), low: parseFloat(r.low), close: parseFloat(r.close), volume: parseInt(r.volume, 10) }));
    return { candles, dataSourceMessage };
  }

  _getDateRange(period, from, to) {
    if (from && to) {
      return { fromDate: new Date(from * 1000), toDate: new Date(to * 1000) };
    }
    
    const toDate = new Date();
    const fromDate = new Date();
    const [value, unit] = period.split(' ');
    const numValue = parseInt(value, 10);

    if (unit.startsWith('month')) {
        fromDate.setMonth(toDate.getMonth() - numValue);
    } else if (unit.startsWith('year')) {
        fromDate.setFullYear(toDate.getFullYear() - numValue);
    }
    return { fromDate, toDate };
  }

  _calculatePerformanceMetrics(signals, candles, config) {
    const { slPercent, tpPercent, tradeExitStrategy } = config;
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    
    let equity = 100000;
    let peakEquity = equity;
    let maxDrawdown = 0;
    const equityCurve = [{ tradeNumber: 0, equity, date: candles[0]?.date.toISOString() }];
    const ruleStats = {};
    let trades = [];

    if (tradeExitStrategy === 'signal') {
        let openTrade = null;
        signals.forEach((signal, index) => {
            if (openTrade && signal.direction !== openTrade.signal.direction) {
                trades.push({ ...openTrade, exitPrice: signal.price, exitDate: new Date(signal.time) });
                openTrade = { signal, entryPrice: signal.price, entryDate: new Date(signal.time) };
            } else if (!openTrade) {
                openTrade = { signal, entryPrice: signal.price, entryDate: new Date(signal.time) };
            }
        });
        if (openTrade) {
            trades.push({ ...openTrade, exitPrice: candles[candles.length - 1].close, exitDate: candles[candles.length - 1].date });
        }
    } else { // 'stop' strategy
        signals.forEach((signal) => {
            const entryPrice = signal.price;
            const entryIndex = signal.candleIndex;
            const stopLoss = signal.direction === 'BUY' ? entryPrice * (1 - slPercent / 100) : entryPrice * (1 + slPercent / 100);
            const takeProfit = signal.direction === 'BUY' ? entryPrice * (1 + tpPercent / 100) : entryPrice * (1 - tpPercent / 100);

            let exitPrice = candles[candles.length - 1].close;
            let exitDate = candles[candles.length - 1].date;

            for (let i = entryIndex + 1; i < candles.length; i++) {
                const candle = candles[i];
                if (signal.direction === 'BUY') {
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
        const pnl = signal.direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
        
        equity += pnl;
        if (equity > peakEquity) peakEquity = equity;
        const drawdown = (peakEquity - equity) / peakEquity;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        if (pnl > 0) {
            wins++;
            totalProfit += pnl;
            signal.rulesPassed.forEach(rule => {
                if (!ruleStats[rule]) ruleStats[rule] = { wins: 0, losses: 0 };
                ruleStats[rule].wins++;
            });
        } else {
            losses++;
            totalLoss += Math.abs(pnl);
             signal.rulesPassed.forEach(rule => {
                if (!ruleStats[rule]) ruleStats[rule] = { wins: 0, losses: 0 };
                ruleStats[rule].losses++;
            });
        }
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
      const { sl = 0.5, tp = 1.0 } = config; 
      console.log(`Starting signal performance analysis with SL=${sl}% and TP=${tp}%...`);
      
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const signalsQuery = `
          SELECT *, price as signal_price, direction as signal_direction, rules_passed as signal_rules
          FROM signals 
          WHERE timestamp >= $1
          ORDER BY timestamp ASC
      `;
      const { rows: signals } = await this.db.query(signalsQuery, [twentyFourHoursAgo]);
      if (signals.length === 0) {
          return { totalSignals: 0, wins: 0, losses: 0, winRate: "0.00%", rulePerformance: [] };
      }
      console.log(`Found ${signals.length} signals to analyze.`);
      
      const firstSignalTime = signals[0].timestamp;
      const lastSignalTime = signals[signals.length - 1].timestamp;
      const endTime = new Date(lastSignalTime.getTime() + 30 * 60 * 1000);

      const candlesQuery = `
          SELECT timestamp, high, low 
          FROM historical_candles 
          WHERE instrument_token = $1 AND timeframe = '1m' AND timestamp >= $2 AND timestamp <= $3
          ORDER BY timestamp ASC
      `;
      const { rows: candles } = await this.db.query(candlesQuery, [this.instrumentToken, firstSignalTime, endTime]);
      if (candles.length === 0) {
          throw new Error("Could not find historical candle data to validate signals.");
      }
      console.log(`Fetched ${candles.length} 1-min candles for validation.`);

      let wins = 0;
      let losses = 0;
      const ruleStats = {};

      for (const signal of signals) {
          const entryPrice = parseFloat(signal.signal_price);
          const stopLossPrice = signal.signal_direction === 'BUY' ? entryPrice * (1 - sl / 100) : entryPrice * (1 + sl / 100);
          const takeProfitPrice = signal.signal_direction === 'BUY' ? entryPrice * (1 + tp / 100) : entryPrice * (1 - tp / 100);

          let outcome = 'undetermined';
          const subsequentCandles = candles.filter(c => new Date(c.timestamp) > new Date(signal.timestamp));
          for (const candle of subsequentCandles) {
              const high = parseFloat(candle.high);
              const low = parseFloat(candle.low);
              if (signal.signal_direction === 'BUY') {
                  if (high >= takeProfitPrice) { outcome = 'win'; break; }
                  if (low <= stopLossPrice) { outcome = 'loss'; break; }
              } else { // SELL
                  if (low <= takeProfitPrice) { outcome = 'win'; break; }
                  if (high >= stopLossPrice) { outcome = 'loss'; break; }
              }
          }
          
          if (outcome === 'win') {
              wins++;
              signal.signal_rules.forEach(rule => {
                  if (!ruleStats[rule]) ruleStats[rule] = { wins: 0, losses: 0 };
                  ruleStats[rule].wins++;
              });
          } else if (outcome === 'loss') {
              losses++;
               signal.signal_rules.forEach(rule => {
                  if (!ruleStats[rule]) ruleStats[rule] = { wins: 0, losses: 0 };
                  ruleStats[rule].losses++;
              });
          }
      }

      const totalSignals = wins + losses;
      const winRate = totalSignals > 0 ? ((wins / totalSignals) * 100).toFixed(2) + '%' : '0.00%';
      const rulePerformance = Object.entries(ruleStats).map(([rule, stats]) => {
          const total = stats.wins + stats.losses;
          return { rule, ...stats, total, winRate: total > 0 ? ((stats.wins / total) * 100).toFixed(2) + '%' : '0.00%' };
      }).sort((a,b) => (b.wins + b.losses) - (a.wins + a.losses));

      console.log("Analysis complete:", { totalSignals, wins, losses, winRate });
      return { totalSignals, wins, losses, winRate, rulePerformance };
  }
  
  async getAIStrategySuggestions(results, apiKey) {
    let ai;
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("Failed to initialize Gemini AI with provided key.", e);
        throw new Error("Invalid Gemini API Key provided.");
    }
    
    const rulePerformanceSummary = results.rulePerformance.map(r => 
        `- ${r.rule}: ${r.wins} wins, ${r.losses} losses (Win Rate: ${r.winRate})`
    ).join('\n');
    
    const contents = `You are a quantitative trading analyst. Analyze the following backtest results for a trading algorithm and provide concrete, actionable suggestions to improve its performance.

### Backtest Performance Summary
- **Instrument:** ${results.instrument}
- **Timeframe:** ${results.timeframe}
- **Exit Strategy:** ${results.tradeExitStrategy === 'signal' ? 'Exit on Opposing Signal' : `Stop Loss/Take Profit`}
- **Win Rate:** ${results.winRate}
- **Total Trades:** ${results.totalTrades}
- **Net Profit:** ${results.netProfit.toFixed(2)} points
- **Profit Factor:** ${results.profitFactor}
- **Max Drawdown:** ${results.maxDrawdown}

### Rule Performance Breakdown
This table shows how many winning and losing trades each rule contributed to when it was part of a signal.
${rulePerformanceSummary}

### Your Task
Based *only* on the data provided, provide 2-3 specific, actionable suggestions to improve the strategy's win rate or profitability. Be concise.

**Example Suggestions:**
*   "Consider removing the 'Candlestick Patterns' rule, as it has a low win rate and contributes to many losses."
*   "The 'Breakout & Retest' rule is very effective. Consider increasing its weight or creating a new strategy that only trades when this rule and 'Volume Analysis' are both present."
*   "The 'Previous Day Levels' rule seems to perform poorly. Try adding a condition that it's only valid if the price is also above the 20-period moving average."

Provide your response as a simple list.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        const errorMessage = (error.message || '').toLowerCase();
        if (errorMessage.includes('billing') || errorMessage.includes('quota') || errorMessage.includes('payment') || (error.status === 429)) {
            throw new Error("The AI analysis could not be completed due to a billing issue. Please check your Google AI Platform account and ensure you have a valid payment method.");
        }
        if (errorMessage.includes('api key not valid')) {
             throw new Error("The provided Gemini API Key is not valid. Please check the key and try again.");
        }
        throw new Error("Failed to get a response from the AI model.");
    }
  }


  // --- DATABASE & LOGGING ---
  
  async _saveSignalToDb(signal) {
    const query = `INSERT INTO signals (symbol, price, direction, rules_passed, rules_failed, conviction) VALUES ($1, $2, $3, $4, $5, $6)`;
    const values = [signal.symbol, signal.price, signal.direction, signal.rulesPassed, signal.rulesFailed, signal.conviction];
    try {
      await this.db.query(query, values);
      console.log(`Signal (${signal.timeframe}) saved to database.`);
    } catch (error) {
      console.error('Error saving signal to database:', error);
    }
  }

  _logSignalToFile(signal) {
    const logEntry = JSON.stringify(signal) + '\n';
    fs.appendFile(signalsLogPath, logEntry, (err) => { if (err) console.error('Error logging signal to file:', err); });
  }

  _logTickToFile(tick) {
    const logEntry = JSON.stringify(tick) + '\n';
    fs.appendFile(ticksLogPath, logEntry, (err) => { if (err) console.error('Error logging tick to file:', err); });
  }
  
  // --- BROADCASTING ---

  _broadcast(message) {
    if (!this.wss || this.wss.clients.size === 0) return;
    const stringifiedMessage = JSON.stringify(message);
    this.wss.clients.forEach((client) => { if (client.readyState === 1) client.send(stringifiedMessage); });
  }

  async _broadcastSignal(signal) {
    this.recentSignals.unshift(signal);
    if (this.recentSignals.length > 20) {
      this.recentSignals.pop();
    }
    
    await this._saveSignalToDb(signal);
    this._logSignalToFile(signal);
    this._broadcast({ type: 'new_signal', payload: signal });
    console.log(`Signal (${signal.timeframe}) broadcasted to ${this.wss.clients.size} clients.`);
    
    this._calculateAndBroadcastSentiment();
  }
  
  _calculateAndBroadcastSentiment() {
    if (this.recentSignals.length === 0) {
        this._broadcast({ type: 'market_sentiment_update', payload: { score: 50 } }); // Neutral
        return;
    }
    const buySignals = this.recentSignals.filter(s => s.direction === 'BUY').length;
    const sentimentScore = Math.round((buySignals / this.recentSignals.length) * 100);
    this._broadcast({ type: 'market_sentiment_update', payload: { score: sentimentScore } });
    console.log(`Market sentiment updated: ${sentimentScore}`);
  }

  _broadcastTick(tick) {
    const payload = { price: tick.last_price, time: tick.timestamp };
    this._broadcast({ type: 'market_tick', payload });
  }

  _broadcastConnectionStatus() {
    const payload = { status: this.connectionStatus, message: this.connectionMessage };
    this._broadcast({ type: 'broker_status_update', payload });
  }

  _broadcastMarketStatus() {
    const payload = { status: this.marketStatus };
    this._broadcast({ type: 'market_status_update', payload });
  }

  _broadcastMarketVitals() {
    this._broadcast({ type: 'market_vitals_update', payload: this.marketVitals });
  }
}

module.exports = PriceActionEngine;