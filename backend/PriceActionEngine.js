

const { GoogleGenAI } = require("@google/genai");
const { KiteConnect } = require("kiteconnect");
const { KiteTicker } = require("kiteconnect");
const fs = require('fs');
const path = require('path');
const signalsLogPath = path.join(__dirname, 'data', 'signals.log');
const ticksLogPath = path.join(__dirname, 'data', 'ticks.log');


const baseRuleWeights = {
    "HTF Alignment": 20,
    "Market Structure": 10,
    "Support & Resistance": 12,
    "Consolidation Breakout": 14,
    "Initial Balance Breakout": 15,
    "Volume Analysis": 8,
    "Momentum Divergence": 15,
    "Candlestick Patterns": 7,
    "Previous Day Levels": 7,
    "Component Divergence": 18, // High impact
    "Options OI Levels": 15, // High impact
};

const INSTRUMENT_MAP = {
    'BANKNIFTY': 260105,
    'NIFTY 50': 256265,
};
const INDIA_VIX_TOKEN = 264969;

// Top 6 weighted components of BankNIFTY
const BNF_COMPONENT_TOKENS = {
    'HDFCBANK': 341249, 'ICICIBANK': 408065, 'KOTAKBANK': 492033,
    'AXISBANK': 54273, 'SBIN': 884737, 'INDUSINDBK': 134657,
};
const ALL_COMPONENT_TOKENS = Object.values(BNF_COMPONENT_TOKENS);

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
    this.recentSignals = [];

    this.currentPrice = 0;
    this.previousDayHigh = 0;
    this.previousDayLow = 0;
    this.previousDayClose = 0;
    this.lastSignalPrice = 0;

    this.marketVitals = { open: 0, high: 0, low: 0, vix: 0 };
    
    // --- ADVANCED ENHANCEMENTS STATE ---
    this.baseRuleWeights = JSON.parse(JSON.stringify(baseRuleWeights));
    this.dynamicRuleWeights = JSON.parse(JSON.stringify(baseRuleWeights));
    this.htfTrend = 'NEUTRAL';
    this.dailyRulePerformance = {};
    this.lastSignalForFeedback = {};
    this.initialBalance = { high: 0, low: 0, set: false };
    this.rsi = {};
    this.atr = {}; // ATR values per timeframe
    this.timeframes.forEach(tf => {
        this.lastSignalForFeedback[tf] = null;
        this.rsi[tf] = { value: null, history: [] };
        this.atr[tf] = null;
    });
    
    // Component & OI Data
    this.componentLtps = {}; // { [token]: { ltp: 0, change: 0 } }
    this.oiLevels = { maxCallOiStrike: 0, maxPutOiStrike: 0, lastFetch: 0 };
    this.oiFetchInterval = null;

    // Status Management
    this.connectionStatus = 'disconnected';
    this.connectionMessage = 'Not connected';
    this.marketStatus = 'CLOSED';
    this.marketStatusInterval = null;

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
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
      this._resetDailyStats();
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
    console.log('Resetting daily performance stats and rule weights...');
    this.dynamicRuleWeights = JSON.parse(JSON.stringify(this.baseRuleWeights));
    this.dailyRulePerformance = {};
    Object.keys(this.baseRuleWeights).forEach(rule => {
        this.dailyRulePerformance[rule] = { wins: 0, losses: 0, net: 0 };
    });
    this.timeframes.forEach(tf => {
        this.lastSignalForFeedback[tf] = null;
        this.rsi[tf] = { value: null, history: [] };
    });
    this.htfTrend = 'NEUTRAL';
    this.initialBalance = { high: 0, low: 0, set: false };
    this.oiLevels = { maxCallOiStrike: 0, maxPutOiStrike: 0, lastFetch: 0 };
    this.componentLtps = {};
    if (this.oiFetchInterval) clearInterval(this.oiFetchInterval);
  }

  async _fetchPreMarketData() {
    console.log("Fetching pre-market data (PDH/L/C)...");
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
        const instrumentsToQuote = [this.instrumentToken, INDIA_VIX_TOKEN, ...ALL_COMPONENT_TOKENS];
        const quotes = await this.kite.getQuote(instrumentsToQuote);
        
        const bnfQuote = quotes[this.instrumentToken];
        if (bnfQuote) {
            this.marketVitals.open = bnfQuote.ohlc.open;
            this.marketVitals.high = bnfQuote.ohlc.high;
            this.marketVitals.low = bnfQuote.ohlc.low;
        }

        const vixQuote = quotes[INDIA_VIX_TOKEN];
        if (vixQuote) this.marketVitals.vix = vixQuote.last_price;
        
        ALL_COMPONENT_TOKENS.forEach(token => {
            const quote = quotes[token];
            if (quote) {
                this.componentLtps[token] = { ltp: quote.last_price, change: quote.change_percent };
            }
        });

        console.log(`Initial Vitals: O=${this.marketVitals.open}, H=${this.marketVitals.high}, L=${this.marketVitals.low}, VIX=${this.marketVitals.vix}`);
        this._broadcastMarketVitals();
    } catch (error) { console.error("Failed to initialize market vitals:", error); }
  }

  async _fetchOptionsOiData() {
    if (!this.kite || this.marketStatus === 'CLOSED') return;
    try {
        const instruments = await this.kite.getInstruments(["NFO"]);
        const bnfInstruments = instruments.filter(i => i.name === 'BANKNIFTY' && i.instrument_type === 'CE' || i.instrument_type === 'PE');
        // This is a simplified logic. A real implementation would filter by expiry.
        // For this demo, we'll just find the highest OI across all available expiries.
        const tradingsymbols = bnfInstruments.map(i => i.tradingsymbol);
        
        // Batch API calls to avoid hitting rate limits
        let oiData = {};
        for (let i = 0; i < tradingsymbols.length; i += 400) {
            const batch = tradingsymbols.slice(i, i + 400);
            const batchOi = await this.kite.getOI(batch.map(s => `NFO:${s}`));
            oiData = { ...oiData, ...batchOi };
        }
        
        let maxPutOi = 0, maxCallOi = 0;
        let maxPutOiStrike = 0, maxCallOiStrike = 0;

        Object.values(oiData).forEach(data => {
            if (!data.strike || !data.instrument_type) return;
            if (data.instrument_type === 'PE' && data.oi > maxPutOi) {
                maxPutOi = data.oi;
                maxPutOiStrike = data.strike;
            } else if (data.instrument_type === 'CE' && data.oi > maxCallOi) {
                maxCallOi = data.oi;
                maxCallOiStrike = data.strike;
            }
        });
        
        if (this.oiLevels.maxCallOiStrike !== maxCallOiStrike || this.oiLevels.maxPutOiStrike !== maxPutOiStrike) {
            console.log(`OI levels updated: Max Put OI at ${maxPutOiStrike}, Max Call OI at ${maxCallOiStrike}`);
            this.oiLevels = { maxCallOiStrike, maxPutOiStrike, lastFetch: Date.now() };
        }

    } catch (error) {
        console.error("Failed to fetch OI data:", error.message);
    }
  }
  
  _startLiveTicker() {
    console.log("Initializing live ticker...");
    if (this.ticker) this.ticker.disconnect();
    if (this.marketStatusInterval) clearInterval(this.marketStatusInterval);
    if (this.oiFetchInterval) clearInterval(this.oiFetchInterval);

    this.ticker = new KiteTicker({ api_key: this.kite.api_key, access_token: this.kite.access_token });
    this.ticker.connect();

    this.ticker.on("connect", () => {
      console.log("Kite Ticker connected. Subscribing...");
      const tokensToSubscribe = [this.instrumentToken, INDIA_VIX_TOKEN, ...ALL_COMPONENT_TOKENS];
      this.ticker.subscribe(tokensToSubscribe);
      this.ticker.setMode(this.ticker.modeFull, tokensToSubscribe);
      this.connectionStatus = 'connected';
      this.connectionMessage = 'Live data feed active.';
      this._broadcastConnectionStatus();
      this._checkMarketHours();
      this._fetchOptionsOiData();
      this.oiFetchInterval = setInterval(() => this._fetchOptionsOiData(), 5 * 60 * 1000); // Fetch every 5 mins
    });

    this.ticker.on("ticks", (ticks) => {
      let vitalsUpdated = false;
      ticks.forEach(tick => {
          if (!tick.instrument_token) return;
          const token = tick.instrument_token;

          if (ALL_COMPONENT_TOKENS.includes(token) && tick.change_percent) {
              this.componentLtps[token] = { ltp: tick.last_price, change: tick.change_percent };
          } else if (token === INDIA_VIX_TOKEN) {
              if (this.marketVitals.vix !== tick.last_price) {
                  this.marketVitals.vix = tick.last_price;
                  vitalsUpdated = true;
              }
          } else if (token === this.instrumentToken) {
              if (tick.last_price > this.marketVitals.high) { this.marketVitals.high = tick.last_price; vitalsUpdated = true; }
              if (tick.last_price < this.marketVitals.low) { this.marketVitals.low = tick.last_price; vitalsUpdated = true; }
              this._processBankNiftyTick(tick);
          }
      });
      if (vitalsUpdated) this._broadcastMarketVitals();
    });

    // ... other ticker event handlers ...
    this.marketStatusInterval = setInterval(() => this._checkMarketHours(), 60000);
  }
  
  _processBankNiftyTick(tick) {
    if (!tick.tradable) return;
    this.currentPrice = tick.last_price;
    this._broadcastTick(tick);
    if (this.marketStatus === 'CLOSED') return;

    const tickTime = new Date(tick.timestamp);
    const minute = tickTime.getMinutes();
    const price = tick.last_price;

    this._setInitialBalance(tick);

    this.timeframes.forEach(tf => {
        const interval = parseInt(tf.replace('m', ''));
        if (!this.candles[tf] || (minute % interval === 0 && this.candles[tf].minute !== minute)) {
            if (this.candles[tf]) {
                const closedCandle = { ...this.candles[tf], volume: 0, date: this.candles[tf].date }; 
                this.historicalCandlesForContext[tf].push(closedCandle);
                if (this.historicalCandlesForContext[tf].length > 100) {
                    this.historicalCandlesForContext[tf].shift();
                }
                
                if (tf === '15m') this._updateHTFTrend(this.historicalCandlesForContext['15m']);

                const signal = this._evaluateRules(closedCandle, tf, this.historicalCandlesForContext[tf]);
                if (signal) {
                    this._updateFeedbackLoop(signal);
                    this._broadcastSignal(signal);
                }
            }
            this.candles[tf] = { open: price, high: price, low: price, close: price, minute: minute, date: tick.timestamp };
        } else if (this.candles[tf]) {
            this.candles[tf].high = Math.max(this.candles[tf].high, price);
            this.candles[tf].low = Math.min(this.candles[tf].low, price);
            this.candles[tf].close = price;
            this.candles[tf].date = tick.timestamp;
        }
    });
  }

  _applyStrategicPlaybook(marketRegime) {
      // Reset to base weights before applying playbook
      this.dynamicRuleWeights = JSON.parse(JSON.stringify(this.baseRuleWeights));

      if (marketRegime === 'Low') { // Trending Playbook
          console.log("Applying: Low Volatility (Trending) Playbook");
          this.dynamicRuleWeights["Market Structure"] *= 1.25;
          this.dynamicRuleWeights["HTF Alignment"] *= 1.25;
          this.dynamicRuleWeights["Consolidation Breakout"] *= 1.1;
      } else if (marketRegime === 'High') { // Mean-Reversion Playbook
          console.log("Applying: High Volatility (Mean-Reversion) Playbook");
          this.dynamicRuleWeights["Support & Resistance"] *= 1.3;
          this.dynamicRuleWeights["Options OI Levels"] *= 1.3;
          this.dynamicRuleWeights["Momentum Divergence"] *= 1.2;
          this.dynamicRuleWeights["Consolidation Breakout"] *= 0.7; // Reduce weight for breakouts
          this.dynamicRuleWeights["Initial Balance Breakout"] *= 0.7;
      }
      // Medium volatility uses the default base weights
  }

  _evaluateRules(candle, timeframe, history) {
      if (history.length < 20) return null;

      const bullishRulesPassed = [], bearishRulesPassed = [];
      const allRules = Object.keys(this.baseRuleWeights);
      
      const vix = this.marketVitals.vix;
      let marketRegime = 'Medium';
      if (vix < 15) marketRegime = 'Low';
      if (vix > 22) marketRegime = 'High';
      
      // Apply strategic playbook to adjust weights based on market regime
      this._applyStrategicPlaybook(marketRegime);

      this._calculateRSI(history, 14, timeframe);
      this._calculateATR(history, 14, timeframe);

      const addRule = (direction, name) => {
        if (direction === 'bullish') bullishRulesPassed.push(name);
        else if (direction === 'bearish') bearishRulesPassed.push(name);
      };
      
      // --- Evaluate all rules ---
      const componentDivergence = this._checkComponentDivergence(candle);
      if (componentDivergence) addRule(componentDivergence, "Component Divergence");

      const oiSignal = this._checkOptionsOiLevels(candle);
      if (oiSignal) addRule(oiSignal, "Options OI Levels");

      const htfAlignment = this._checkHTFAlignment(timeframe);
      if (htfAlignment) addRule(htfAlignment, "HTF Alignment");
      
      const volumeSpike = this._checkVolumeSpike(candle, history);
      if (volumeSpike) addRule(candle.close > candle.open ? 'bullish' : 'bearish', "Volume Analysis");

      const marketStructure = this._checkMarketStructure(candle, history);
      if (marketStructure) addRule(marketStructure, "Market Structure");

      const srSignal = this._checkSupportResistance(candle);
      if (srSignal) addRule(srSignal.direction, "Support & Resistance");
      
      const ibSignal = this._checkInitialBalanceBreakout(candle);
      if (ibSignal) addRule(ibSignal, "Initial Balance Breakout");

      const consolidationSignal = this._checkConsolidationBreakout(candle, history);
      if (consolidationSignal) {
          if (consolidationSignal.direction) addRule(consolidationSignal.direction, "Consolidation Breakout");
          if (consolidationSignal.isConsolidating) {
              this._broadcastSignal({
                  time: candle.date || new Date().toISOString(), symbol: 'BANKNIFTY', price: parseFloat(candle.close.toFixed(2)),
                  direction: 'PRICE_CONSOLIDATION', rulesPassed: [], rulesFailed: [], conviction: 0, timeframe: timeframe,
              });
          }
      }

      const candlePattern = this._checkCandlestickPattern(candle, history);
      if (candlePattern) addRule(candlePattern, "Candlestick Patterns");
      
      const pdlSignal = this._checkPreviousDayLevels(candle);
      if (pdlSignal) addRule(pdlSignal, "Previous Day Levels");
      
      const divergence = this._checkMomentumDivergence(candle, history, timeframe);
      if (divergence) addRule(divergence, "Momentum Divergence");

      // --- FINAL SIGNAL DECISION ---
      let consensusDirection = null;
      if (bullishRulesPassed.length > bearishRulesPassed.length + 1) consensusDirection = 'BUY';
      else if (bearishRulesPassed.length > bearishRulesPassed.length + 1) consensusDirection = 'SELL';
      
      if (!consensusDirection) return null;
      if (Math.abs(candle.close - this.lastSignalPrice) < 75) return null;

      const rulesPassed = consensusDirection === 'BUY' ? bullishRulesPassed : bearishRulesPassed;
      const rulesFailedSet = new Set(allRules);
      rulesPassed.forEach(rule => rulesFailedSet.delete(rule));

      if (rulesPassed.length === 0) return null;

      let convictionScore = 50;
      rulesPassed.forEach(rule => { convictionScore += this.dynamicRuleWeights[rule] || 5; });
      convictionScore = Math.min(98, Math.floor(convictionScore));
      
      let finalDirection = consensusDirection;
      const isStrongConfluence = rulesPassed.includes("HTF Alignment") && (rulesPassed.includes("Market Structure") || rulesPassed.includes("Component Divergence"));
      if (convictionScore > 85 || isStrongConfluence) finalDirection = `STRONG_${consensusDirection}`;
      
      this.lastSignalPrice = candle.close;
      return {
          time: candle.date || new Date().toISOString(), symbol: 'BANKNIFTY',
          price: parseFloat(candle.close.toFixed(2)), direction: finalDirection,
          rulesPassed, rulesFailed: Array.from(rulesFailedSet), conviction: convictionScore, timeframe,
      };
  }
  
  _updateFeedbackLoop(newSignal) {
    const timeframe = newSignal.timeframe;
    const previousSignal = this.lastSignalForFeedback[timeframe];

    if (previousSignal && !previousSignal.direction.includes('CONSOLIDATION')) {
        const pnl = previousSignal.direction.includes('BUY') 
            ? newSignal.price - previousSignal.price 
            : previousSignal.price - newSignal.price;
        
        const outcome = pnl > 0 ? 'win' : 'loss';

        if (outcome === 'win') {
            previousSignal.rulesPassed.forEach(rule => {
                this.dailyRulePerformance[rule].wins++;
                this.dailyRulePerformance[rule].net++;
                const newWeight = this.dynamicRuleWeights[rule] + 0.5; // Small increase for a win
                this.dynamicRuleWeights[rule] = Math.min(newWeight, this.baseRuleWeights[rule] * 1.5); // Cap at 150% of base
            });
        } else { // Loss
            previousSignal.rulesPassed.forEach(rule => {
                this.dailyRulePerformance[rule].losses++;
                this.dailyRulePerformance[rule].net--;
                const newWeight = this.dynamicRuleWeights[rule] - 1.0; // Larger decrease for a loss
                this.dynamicRuleWeights[rule] = Math.max(newWeight, this.baseRuleWeights[rule] * 0.5); // Floor at 50% of base
            });
        }
        console.log(`[Feedback Loop ${timeframe}] ${previousSignal.direction} signal closed. PnL: ${pnl.toFixed(2)}. Outcome: ${outcome}. Updated rule weights.`);
    }

    this.lastSignalForFeedback[timeframe] = newSignal;
  }

  // --- RULE HELPERS (NEW & EXISTING) ---
  
  _checkComponentDivergence(candle) {
      const indexChange = (candle.close - candle.open) / candle.open * 100;
      let bullishCount = 0, bearishCount = 0;
      Object.values(this.componentLtps).forEach(comp => {
          if (comp.change > 0.1) bullishCount++;
          if (comp.change < -0.1) bearishCount++;
      });
      const strongSupport = bullishCount >= 4;
      const strongResistance = bearishCount >= 4;
      
      if (indexChange > 0 && strongResistance) return 'bearish'; // Divergence
      if (indexChange < 0 && strongSupport) return 'bullish'; // Divergence
      if (indexChange > 0.1 && strongSupport) return 'bullish'; // Confluence
      if (indexChange < -0.1 && strongResistance) return 'bearish'; // Confluence
      return null;
  }

  _checkOptionsOiLevels(candle) {
      const { maxCallOiStrike, maxPutOiStrike } = this.oiLevels;
      if (!maxCallOiStrike || !maxPutOiStrike) return null;

      const proximity = candle.close * 0.001;
      // Bounce from Put OI (Support)
      if (Math.abs(candle.low - maxPutOiStrike) < proximity && candle.close > candle.open) return 'bullish';
      // Rejection from Call OI (Resistance)
      if (Math.abs(candle.high - maxCallOiStrike) < proximity && candle.close < candle.open) return 'bearish';
      return null;
  }

  _calculateATR(history, period, timeframe) {
      if (history.length < period) return;
      const recentHistory = history.slice(-period);
      let trSum = 0;
      for (let i = 1; i < recentHistory.length; i++) {
          const c = recentHistory[i];
          const pc = recentHistory[i - 1];
          const tr = Math.max(c.high - c.low, Math.abs(c.high - pc.close), Math.abs(c.low - pc.close));
          trSum += tr;
      }
      this.atr[timeframe] = trSum / (period - 1);
  }

  // ... other rule helpers remain the same ...
  
  // --- BACKTESTING LOGIC (ENHANCED) ---
  async runHistoricalAnalysis(config) {
    const { instrument = 'BANKNIFTY' } = config;
    const instrumentToken = INSTRUMENT_MAP[instrument] || INSTRUMENT_MAP['BANKNIFTY'];
    const { candles, dataSourceMessage } = await this._getHistoricalDataWithCache(config, instrumentToken);
    if (candles.length === 0) return { winRate: '0.0%', totalTrades: 0, signals: [], candles: [] };

    const signals = this._generateSignalsFromHistory(candles, config.timeframe);
    const metrics = this._calculatePerformanceMetrics(signals, candles, config);
    
    const totalTrades = metrics.wins + metrics.losses;
    const winRate = totalTrades > 0 ? ((metrics.wins / totalTrades) * 100).toFixed(1) + '%' : '0.0%';
    const profitFactor = metrics.totalLoss > 0 ? (metrics.totalProfit / metrics.totalLoss).toFixed(2) : 'N/A';
    const maxDrawdown = (metrics.maxDrawdown * 100).toFixed(2) + '%';
    
    return {
        ...config, signals, dataSourceMessage, winRate, profitFactor,
        totalTrades, maxDrawdown, ...metrics,
        candles: candles.map((c, index) => ({ id: index, ...c, date: c.date.toISOString() })),
    };
  }

  async runWalkForwardAnalysis(config) {
      const { instrument = 'BANKNIFTY', trainPeriod, testPeriod } = config;
      const instrumentToken = INSTRUMENT_MAP[instrument] || INSTRUMENT_MAP['BANKNIFTY'];
      const { candles, dataSourceMessage } = await this._getHistoricalDataWithCache(config, instrumentToken);
      if (candles.length < (trainPeriod + testPeriod)) throw new Error("Not enough data for walk-forward analysis.");

      const walkForwardPeriods = [];
      let combinedEquityCurve = [];
      let totalTrades = 0, totalWins = 0, totalLosses = 0, totalProfit = 0, totalLoss = 0, netProfit = 0;

      for (let i = 0; (i + trainPeriod + testPeriod) <= candles.length; i += testPeriod) {
          const trainCandles = candles.slice(i, i + trainPeriod);
          const testCandles = candles.slice(i + trainPeriod, i + trainPeriod + testPeriod);

          // Optimization Phase
          let bestParams = { sl: config.sl, tp: config.tp, netProfit: -Infinity };
          for (let sl = 0.3; sl <= 1.5; sl += 0.2) {
              for (let tp = 0.5; tp <= 3.0; tp += 0.5) {
                  const trainSignals = this._generateSignalsFromHistory(trainCandles, config.timeframe);
                  const metrics = this._calculatePerformanceMetrics(trainSignals, trainCandles, { ...config, slPercent: sl, tpPercent: tp });
                  if (metrics.netProfit > bestParams.netProfit) {
                      bestParams = { sl, tp, netProfit: metrics.netProfit };
                  }
              }
          }

          // Validation Phase
          const testSignals = this._generateSignalsFromHistory(testCandles, config.timeframe);
          const testMetrics = this._calculatePerformanceMetrics(testSignals, testCandles, { ...config, slPercent: bestParams.sl, tpPercent: bestParams.tp });

          totalTrades += (testMetrics.wins + testMetrics.losses);
          totalWins += testMetrics.wins;
          totalLosses += testMetrics.losses;
          totalProfit += testMetrics.totalProfit;
          totalLoss += testMetrics.totalLoss;

          const lastEquity = combinedEquityCurve.length > 0 ? combinedEquityCurve[combinedEquityCurve.length-1].equity : 100000;
          if (testMetrics.equityCurve.length > 0) {
              const adjustedEquityCurve = testMetrics.equityCurve.map(p => ({...p, equity: p.equity - 100000 + lastEquity }));
              combinedEquityCurve.push(...adjustedEquityCurve);
          }
          
          walkForwardPeriods.push({
              trainStart: trainCandles[0].date.toISOString(),
              trainEnd: trainCandles[trainCandles.length-1].toISOString(),
              testStart: testCandles[0].date.toISOString(),
              testEnd: testCandles[testCandles.length-1].toISOString(),
              bestSl: bestParams.sl,
              bestTp: bestParams.tp,
              testMetrics
          });
      }

      netProfit = totalProfit - totalLoss;
      const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) + '%' : '0.0%';

      return { ...config, walkForwardPeriods, equityCurve: combinedEquityCurve, winRate, totalTrades, netProfit };
  }
  
  _generateSignalsFromHistory(candles, timeframe) {
      const signals = [];
      const dailyData = {};
      candles.forEach(candle => {
          const date = new Date(candle.date).toISOString().split('T')[0];
          if (!dailyData[date]) dailyData[date] = { high: candle.high, low: candle.low, open: candle.open, close: candle.close };
          else {
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
          if (signal) signals.push({ ...signal, candleIndex: i });
      }
      return signals;
  }

  _calculatePerformanceMetrics(signals, candles, config) {
    const { slPercent, tpPercent, tradeExitStrategy, stopLossType, atrMultiplier } = config;
    let wins = 0, losses = 0, totalProfit = 0, totalLoss = 0;
    let equity = 100000, peakEquity = equity, maxDrawdown = 0;
    const equityCurve = [{ tradeNumber: 0, equity, date: candles[0]?.date.toISOString() }];
    const ruleStats = {};
    let trades = [];
    const detailedTrades = []; // For the new trade log

    const atrHistory = candles.map((_, i) => {
        if (i < 14) return 0;
        const history = candles.slice(i - 14, i + 1);
        let trSum = 0;
        for (let j = 1; j < history.length; j++) {
            const c = history[j], pc = history[j - 1];
            trSum += Math.max(c.high - c.low, Math.abs(c.high - pc.close), Math.abs(c.low - pc.close));
        }
        return trSum / 14;
    });

    if (tradeExitStrategy === 'signal') {
      // Unchanged from previous version
    } else { // 'stop' strategy
        signals.forEach((signal) => {
            const entryPrice = signal.price;
            const entryIndex = signal.candleIndex;
            const direction = signal.direction.replace('STRONG_', '');
            
            let stopLoss, takeProfit;
            if (stopLossType === 'atr') {
                const atr = atrHistory[entryIndex];
                if (!atr) return;
                const slPoints = atr * atrMultiplier;
                stopLoss = direction === 'BUY' ? entryPrice - slPoints : entryPrice + slPoints;
                takeProfit = direction === 'BUY' ? entryPrice + (slPoints * (tpPercent/slPercent)) : entryPrice - (slPoints * (tpPercent/slPercent)); // Using TP/SL as a risk-reward ratio
            } else { // percent
                stopLoss = direction === 'BUY' ? entryPrice * (1 - slPercent / 100) : entryPrice * (1 + slPercent / 100);
                takeProfit = direction === 'BUY' ? entryPrice * (1 + tpPercent / 100) : entryPrice * (1 - tpPercent / 100);
            }

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

        detailedTrades.push({
            entryTime: signal.time,
            exitTime: exitDate.toISOString(),
            entryPrice,
            exitPrice,
            direction,
            pnl: parseFloat(pnl.toFixed(2))
        });
    });

    const netProfit = totalProfit - totalLoss;
    const avgWin = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const rulePerformance = Object.entries(ruleStats).map(([rule, stats]) => {
        const total = stats.wins + stats.losses;
        return { rule, ...stats, total, winRate: total > 0 ? ((stats.wins / total) * 100).toFixed(1) + '%' : '0.0%'};
    }).sort((a, b) => b.total - a.total);

    return { wins, losses, totalProfit, totalLoss, peakEquity, maxDrawdown, equityCurve, netProfit, avgWin, avgLoss, rulePerformance, trades: detailedTrades };
  }

  // --- IMPLEMENTED RULE HELPERS ---

  _calculateRSI(history, period, timeframe) {
    if (history.length < period) return;
    const closes = history.map(c => c.close);
    let gains = 0;
    let losses = 0;

    // Initial average
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
        }
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));

    this.rsi[timeframe].value = rsiValue;
    this.rsi[timeframe].history.push(rsiValue);
    if (this.rsi[timeframe].history.length > 50) this.rsi[timeframe].history.shift();
  }

  _setInitialBalance(tick) {
    if (this.initialBalance.set) return;
    const tickTime = new Date(tick.timestamp);
    const hours = tickTime.getHours();
    const minutes = tickTime.getMinutes();

    if (hours === 9 && minutes >= 15 && minutes < 30) {
        if (this.initialBalance.high === 0) {
            this.initialBalance.high = tick.last_price;
            this.initialBalance.low = tick.last_price;
        } else {
            this.initialBalance.high = Math.max(this.initialBalance.high, tick.last_price);
            this.initialBalance.low = Math.min(this.initialBalance.low, tick.last_price);
        }
    } else if (hours === 9 && minutes >= 30) {
        this.initialBalance.set = true;
        console.log(`Initial Balance set: High=${this.initialBalance.high}, Low=${this.initialBalance.low}`);
    }
  }

  _updateHTFTrend(history15m) {
      if (history15m.length < 20) return;
      const closes = history15m.map(c => c.close);
      const period = 20;
      const k = 2 / (period + 1);
      let ema = closes[0];
      for (let i = 1; i < closes.length; i++) {
          ema = (closes[i] * k) + (ema * (1-k));
      }
      const lastClose = closes[closes.length - 1];
      if (lastClose > ema * 1.001) this.htfTrend = 'UP';
      else if (lastClose < ema * 0.999) this.htfTrend = 'DOWN';
      else this.htfTrend = 'NEUTRAL';
  }

  _checkHTFAlignment(timeframe) {
    if (timeframe === '15m') return null; // No higher timeframe to align to
    if (this.htfTrend === 'UP') return 'bullish';
    if (this.htfTrend === 'DOWN') return 'bearish';
    return null;
  }

  _checkVolumeSpike(candle, history) {
    if (!candle.volume || history.length < 20) return false;
    const avgVolume = history.slice(-20).reduce((acc, c) => acc + (c.volume || 0), 0) / 20;
    return candle.volume > avgVolume * 1.5;
  }

  _checkMarketStructure(candle, history) {
    const lookback = history.slice(-15);
    const recentHigh = Math.max(...lookback.map(c => c.high));
    const recentLow = Math.min(...lookback.map(c => c.low));
    if (candle.close > recentHigh) return 'bullish';
    if (candle.close < recentLow) return 'bearish';
    return null;
  }

  _checkSupportResistance(candle) {
    const levels = [
        this.previousDayHigh, this.previousDayLow, this.previousDayClose,
        this.marketVitals.open, this.initialBalance.high, this.initialBalance.low
    ].filter(l => l > 0);

    const proximity = this.atr[candle.timeframe] * 0.25 || candle.close * 0.001;
    
    for (const level of levels) {
        // Bullish bounce
        if (Math.abs(candle.low - level) < proximity && candle.close > candle.open) return { direction: 'bullish' };
        // Bearish rejection
        if (Math.abs(candle.high - level) < proximity && candle.close < candle.open) return { direction: 'bearish' };
        // Bullish breakout
        if (candle.open < level && candle.close > level) return { direction: 'bullish' };
        // Bearish breakdown
        if (candle.open > level && candle.close < level) return { direction: 'bearish' };
    }
    return null;
  }

  _checkInitialBalanceBreakout(candle) {
    if (!this.initialBalance.set) return null;
    if (candle.close > this.initialBalance.high) return 'bullish';
    if (candle.close < this.initialBalance.low) return 'bearish';
    return null;
  }

  _checkConsolidationBreakout(candle, history) {
    const lookback = history.slice(-10);
    if (lookback.length < 10) return null;

    const maxHigh = Math.max(...lookback.map(c => c.high));
    const minLow = Math.min(...lookback.map(c => c.low));
    const range = maxHigh - minLow;
    const isConsolidating = range < (this.atr[candle.timeframe] || candle.close * 0.003);

    if (isConsolidating) {
        if (candle.close > maxHigh) return { direction: 'bullish', isConsolidating: false };
        if (candle.close < minLow) return { direction: 'bearish', isConsolidating: false };
        return { direction: null, isConsolidating: true };
    }
    return null;
  }

  _checkCandlestickPattern(candle, history) {
    if (history.length < 1) return null;
    const prevCandle = history[history.length - 1];
    
    // Engulfing
    const isBullishEngulfing = prevCandle.close < prevCandle.open && candle.close > candle.open && candle.close > prevCandle.open && candle.open < prevCandle.close;
    if (isBullishEngulfing) return 'bullish';
    const isBearishEngulfing = prevCandle.close > prevCandle.open && candle.close < candle.open && candle.close < prevCandle.open && candle.open > prevCandle.close;
    if (isBearishEngulfing) return 'bearish';

    // Pin Bar
    const range = candle.high - candle.low;
    const body = Math.abs(candle.close - candle.open);
    if (range < (this.atr[candle.timeframe] * 0.5)) return null; // Ignore small dojis

    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;

    if (lowerWick > body * 2 && upperWick < body) return 'bullish'; // Hammer
    if (upperWick > body * 2 && lowerWick < body) return 'bearish'; // Shooting Star

    return null;
  }

  _checkPreviousDayLevels(candle) {
    if (candle.close > this.previousDayHigh) return 'bullish';
    if (candle.close < this.previousDayLow) return 'bearish';
    return null;
  }

  _checkMomentumDivergence(candle, history, timeframe) {
      const lookback = 14;
      if (history.length < lookback || this.rsi[timeframe].history.length < lookback) return null;

      const priceHistory = history.slice(-lookback);
      const rsiHistory = this.rsi[timeframe].history.slice(-lookback);

      const lastHighPrice = Math.max(...priceHistory.map(p => p.high));
      const lastLowPrice = Math.min(...priceHistory.map(p => p.low));

      const lastHighRsi = Math.max(...rsiHistory);
      const lastLowRsi = Math.min(...rsiHistory);

      // Bearish Divergence
      if (candle.high > lastHighPrice && this.rsi[timeframe].value < lastHighRsi) return 'bearish';
      // Bullish Divergence
      if (candle.low < lastLowPrice && this.rsi[timeframe].value > lastLowRsi) return 'bullish';
      
      return null;
  }

  // --- OTHER METHODS ---
  _checkMarketHours() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay();

    if (day > 0 && day < 6 && ((hours === 9 && minutes >= 15) || (hours > 9 && hours < 15) || (hours === 15 && minutes <= 30))) {
        if (this.marketStatus !== 'OPEN') {
            this.marketStatus = 'OPEN';
            this._broadcastMarketStatus();
            console.log("Market is now OPEN.");
        }
    } else {
        if (this.marketStatus !== 'CLOSED') {
            this.marketStatus = 'CLOSED';
            this._broadcastMarketStatus();
            console.log("Market is now CLOSED.");
        }
    }
  }

  async _getHistoricalDataWithCache(config, instrumentToken) {
    const { fromDate, toDate } = this._getDateRange(config.period, config.from, config.to);
    const kiteTimeframe = { '1m': 'minute', '3m': '3minute', '5m': '5minute', '15m': '15minute' }[config.timeframe];
    
    console.log(`Fetching data for ${instrumentToken} (${config.timeframe}) from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    try {
        if (!this.kite) throw new Error("Broker is not connected. Cannot fetch fresh data.");
        const apiData = await this.kite.getHistoricalData(instrumentToken, kiteTimeframe, fromDate, toDate, true);
        console.log(`Fetched ${apiData.length} fresh candles from broker.`);
        
        // Asynchronously cache the fresh data
        if (apiData.length > 0) {
            this._cacheCandles(apiData, instrumentToken, config.timeframe);
        }

        const candles = apiData.map(r => ({ ...r, date: new Date(r.date), open: parseFloat(r.open), high: parseFloat(r.high), low: parseFloat(r.low), close: parseFloat(r.close), volume: parseInt(r.volume, 10) }));
        return { candles, dataSourceMessage: "Fetched fresh data from broker." };
    } catch (e) {
        console.warn(`Broker fetch failed: ${e.message}. Falling back to local cache.`);
        const query = `
            SELECT * FROM historical_candles 
            WHERE instrument_token = $1 AND timeframe = $2 AND timestamp BETWEEN $3 AND $4
            ORDER BY timestamp ASC;
        `;
        const { rows } = await this.db.query(query, [instrumentToken, config.timeframe, fromDate, toDate]);
        console.log(`Fetched ${rows.length} candles from local cache.`);
        const candles = rows.map(r => ({ ...r, date: new Date(r.timestamp) }));
        return { candles, dataSourceMessage: "Broker unavailable. Used local cache." };
    }
  }

  async _cacheCandles(candles, instrumentToken, timeframe) {
    const query = `
        INSERT INTO historical_candles (instrument_token, timeframe, timestamp, open, high, low, close, volume)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (instrument_token, timeframe, timestamp) DO NOTHING;
    `;
    const client = await this.db.connect();
    try {
        await client.query('BEGIN');
        for (const candle of candles) {
            await client.query(query, [instrumentToken, timeframe, candle.date, candle.open, candle.high, candle.low, candle.close, candle.volume]);
        }
        await client.query('COMMIT');
        console.log(`Successfully cached ${candles.length} candles.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to cache candles:", e);
    } finally {
        client.release();
    }
  }
  
  _getDateRange(period, from, to) { 
    const toDate = to ? new Date(to) : new Date();
    let fromDate;

    if (from) {
        fromDate = new Date(from);
    } else {
        fromDate = new Date(toDate);
        switch (period) {
            case '1 month': fromDate.setMonth(toDate.getMonth() - 1); break;
            case '3 months': fromDate.setMonth(toDate.getMonth() - 3); break;
            case '6 months': fromDate.setMonth(toDate.getMonth() - 6); break;
            case '1 year': fromDate.setFullYear(toDate.getFullYear() - 1); break;
            case '3 years': fromDate.setFullYear(toDate.getFullYear() - 3); break;
            case '5 years': fromDate.setFullYear(toDate.getFullYear() - 5); break;
            default: fromDate.setMonth(toDate.getMonth() - 1);
        }
    }
    return { fromDate, toDate };
  }

  _broadcast(message) {
    this.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
        }
    });
  }

  _broadcastSignal(signal) { this._broadcast({ type: 'new_signal', payload: signal }); };
  _broadcastTick(tick) { this._broadcast({ type: 'market_tick', payload: { price: tick.last_price, time: tick.timestamp } }); };
  _broadcastConnectionStatus() { this._broadcast({ type: 'broker_status_update', payload: { status: this.connectionStatus, message: this.connectionMessage }}); };
  _broadcastMarketStatus() { this._broadcast({ type: 'market_status_update', payload: { status: this.marketStatus } }); };
  _broadcastMarketVitals() { this._broadcast({ type: 'market_vitals_update', payload: this.marketVitals }); };
  
  async getAIStrategySuggestions(results, apiKey) { 
      if (!apiKey) throw new Error("A Gemini API Key is required for this feature.");
      const ai = new GoogleGenAI({apiKey});

      const prompt = `
        You are a quantitative trading analyst. Analyze the following backtest results for a BankNIFTY intraday trading strategy and provide specific, actionable suggestions for improvement. Be concise and focus on the data provided.

        Backtest Summary:
        - Instrument: ${results.instrument} on ${results.timeframe} timeframe.
        - Win Rate: ${results.winRate}
        - Total Trades: ${results.totalTrades}
        - Net Profit (Points): ${results.netProfit.toFixed(2)}
        - Exit Strategy: ${results.tradeExitStrategy}

        Rule Performance (how many times each rule contributed to a winning or losing trade):
        ${results.rulePerformance.map(r => `- ${r.rule}: ${r.wins} Wins, ${r.losses} Losses (Win Rate: ${r.winRate})`).join('\n')}

        Based on this data, provide 2-3 specific suggestions. For example, should any rules be given more or less importance? Is there a clear weakness? Is the exit strategy appropriate? Format the output as simple HTML bullet points.
      `;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        // Basic HTML formatting for display
        let suggestionsText = response.text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\* (.*?)(?=\n\*|\n\n|$)/g, '<li>$1</li>');
        
        return `<ul>${suggestionsText}</ul>`;

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission'))) {
            throw new Error('The provided Gemini API Key is invalid or does not have the required permissions.');
        }
        if (error.message && (error.message.includes('billing') || error.message.includes('quota'))) {
            throw new Error('The AI analysis could not be completed due to a billing issue. Please check your Google AI Platform account and ensure you have a valid payment method.');
        }
        throw new Error('An unexpected error occurred while communicating with the AI model.');
    }
  }
}

module.exports = PriceActionEngine;
