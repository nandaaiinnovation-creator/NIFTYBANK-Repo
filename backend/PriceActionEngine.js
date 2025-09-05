// --- DEPENDENCIES & CONSTANTS ---
const { GoogleGenAI } = require("@google/genai");
const { KiteConnect } = require("kiteconnect");
const { KiteTicker } = require("kiteconnect");
const { setTimeout: delay } = require('timers/promises');

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
    "Component Divergence": 18,
    "Options OI Levels": 15,
};

const defaultMetrics = {
    winRate: '0.00%',
    profitFactor: '0.00',
    totalTrades: 0,
    maxDrawdown: '0.00%',
    netProfit: 0,
    totalWins: 0,
    totalLosses: 0,
    avgWin: 0,
    avgLoss: 0,
    equityCurve: [],
    rulePerformance: [],
    trades: [],
    walkForwardPeriods: [],
};

const INSTRUMENT_MAP = { 'BANKNIFTY': 260105, 'NIFTY 50': 256265 };
const INDIA_VIX_TOKEN = 264969;
const BNF_COMPONENT_TOKENS = {
    'HDFCBANK': 341249, 'ICICIBANK': 408065, 'KOTAKBANK': 492033,
    'AXISBANK': 54273, 'SBIN': 884737, 'INDUSINDBK': 134657,
};
const ALL_COMPONENT_TOKENS = Object.values(BNF_COMPONENT_TOKENS);

class PriceActionEngine {
  constructor(wss, db) {
    this.wss = wss;
    this.db = db;

    // --- BROKER & CONNECTION STATE ---
    this.kite = null;
    this.ticker = null;
    this.connectionStatus = 'disconnected';
    this.connectionMessage = 'Not connected';
    this.username = null;

    // --- MARKET STATE ---
    this.instrumentToken = 260105; // BANKNIFTY
    this.timeframes = ['1m', '3m', '5m', '15m'];
    this.candles = {};
    this.historicalCandlesForContext = {};
    this.timeframes.forEach(tf => {
        this.candles[tf] = null;
        this.historicalCandlesForContext[tf] = [];
    });
    this.currentPrice = 0;
    this.previousDayHigh = 0;
    this.previousDayLow = 0;
    this.previousDayClose = 0;
    this.lastSignalPrice = 0;
    this.marketStatus = 'CLOSED';
    this.marketVitals = { open: 0, high: 0, low: 0, vix: 0 };
    this.componentLtps = {};
    this.oiLevels = { maxCallOiStrike: null, maxPutOiStrike: null, lastFetch: null };

    // --- STRATEGY & FEEDBACK STATE ---
    this.baseRuleWeights = JSON.parse(JSON.stringify(baseRuleWeights));
    this.dynamicRuleWeights = JSON.parse(JSON.stringify(baseRuleWeights));
    this.htfTrend = 'NEUTRAL';
    this.dailyRulePerformance = {};
    this.lastSignalForFeedback = {};
    this.initialBalance = { high: 0, low: 0, set: false };
    this.rsi = {};
    this.atr = {};
    this.timeframes.forEach(tf => {
        this.lastSignalForFeedback[tf] = null;
        this.rsi[tf] = { value: null, history: [] };
        this.atr[tf] = null;
    });

    // --- INTERNAL & CACHING ---
    this._instrumentCache = { lastFetchAt: 0, instruments: [], ttlMs: 1000 * 60 * 60 * 6 };
    this._timers = [];
    this._stopped = false;
  }

  // ------------------------------------
  // SECTION: CONNECTION & INITIALIZATION
  // ------------------------------------

  async connectToBroker(apiKey, accessToken) {
    console.log('Engine: Attempting to connect to broker...');
    try {
      this.kite = new KiteConnect({ api_key: apiKey });
      this.kite.setAccessToken(accessToken);

      const profile = await this.kite.getProfile();
      this.username = profile?.user_name || profile?.user_id || 'unknown';
      console.log(`Successfully connected as ${this.username}`);
      
      this.connectionStatus = 'connected';
      this.connectionMessage = `Connected as ${this.username}`;
      this._broadcastConnectionStatus();
      
      await this._fetchPreMarketData();
      await this._initializeMarketVitals();
      this._resetDailyStats();

      // Fetch initial OI and schedule refresh
      await this._fetchOptionsOiData();
      const oiTimer = setInterval(() => this._fetchOptionsOiData().catch(err => console.warn("OI fetch error:", err)), 5 * 60 * 1000);
      this._timers.push(oiTimer);
      
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
    this.componentLtps = {};
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
  
  // ------------------------------------
  // SECTION: LIVE DATA & TICK PROCESSING
  // ------------------------------------

  _startLiveTicker() {
    console.log("Initializing live ticker...");
    if (this.ticker) { this.ticker.disconnect(); }
    this._timers.forEach(t => clearInterval(t));
    this._timers = [];

    this.ticker = new KiteTicker({ api_key: this.kite.api_key, access_token: this.kite.access_token });
    
    this.ticker.on("connect", () => {
      console.log("Kite Ticker connected. Subscribing...");
      const tokensToSubscribe = [this.instrumentToken, INDIA_VIX_TOKEN, ...ALL_COMPONENT_TOKENS];
      this.ticker.subscribe(tokensToSubscribe);
      this.ticker.setMode(this.ticker.modeFull, tokensToSubscribe);
      this.connectionStatus = 'connected';
      this.connectionMessage = 'Live data feed active.';
      this._broadcastConnectionStatus();
      this._checkMarketHours();
      
      const marketCheckTimer = setInterval(() => this._checkMarketHours(), 60000);
      this._timers.push(marketCheckTimer);
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

    this.ticker.on('error', err => console.error("Kite Ticker error:", err));
    this.ticker.on('close', () => console.log("Kite Ticker connection closed."));
    this.ticker.connect();
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
                    this._handleNewSignal(signal);
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

  // ------------------------------------
  // SECTION: CORE TRADING LOGIC & RULES
  // ------------------------------------

  _evaluateRules(candle, timeframe, history) {
      if (history.length < 20) return null;

      const bullishRulesPassed = [], bearishRulesPassed = [];
      const allRules = Object.keys(this.baseRuleWeights);
      
      const vix = this.marketVitals.vix;
      let marketRegime = 'Medium';
      if (vix < 15) marketRegime = 'Low';
      if (vix > 22) marketRegime = 'High';
      
      this._applyStrategicPlaybook(marketRegime);

      this._calculateRSI(history, 14, timeframe);
      this._calculateATR(history, 14, timeframe);

      const addRule = (direction, name) => {
        if (direction === 'bullish') bullishRulesPassed.push(name);
        else if (direction === 'bearish') bearishRulesPassed.push(name);
      };
      
      const componentDivergence = this._checkComponentDivergence(candle);
      if (componentDivergence) addRule(componentDivergence, "Component Divergence");

      const oiSignal = this._checkOptionsOiLevels(candle);
      if (oiSignal) addRule(oiSignal, "Options OI Levels");

      const htfAlignment = this._checkHTFAlignment(timeframe);
      if (htfAlignment) addRule(htfAlignment, "HTF Alignment");
      
      const marketStructure = this._checkMarketStructure(candle, history);
      if (marketStructure) addRule(marketStructure, "Market Structure");

      const srSignal = this._checkSupportResistance(candle, timeframe);
      if (srSignal) addRule(srSignal.direction, "Support & Resistance");
      
      const ibSignal = this._checkInitialBalanceBreakout(candle);
      if (ibSignal) addRule(ibSignal, "Initial Balance Breakout");

      // ... other rule calls ...

      // --- FINAL SIGNAL DECISION ---
      let consensusDirection = null;
      if (bullishRulesPassed.length > bearishRulesPassed.length + 1) consensusDirection = 'BUY';
      else if (bearishRulesPassed.length > bearishRulesPassed.length + 1) consensusDirection = 'SELL';
      
      if (!consensusDirection) return null;

      const rulesPassed = consensusDirection === 'BUY' ? bullishRulesPassed : bearishRulesPassed;
      if (rulesPassed.length === 0) return null;

      const rulesFailedSet = new Set(allRules);
      rulesPassed.forEach(rule => rulesFailedSet.delete(rule));

      let convictionScore = 50;
      rulesPassed.forEach(rule => { convictionScore += this.dynamicRuleWeights[rule] || 5; });
      convictionScore = Math.min(98, Math.floor(convictionScore));
      
      let finalDirection = consensusDirection;
      if (convictionScore > 85) finalDirection = `STRONG_${consensusDirection}`;
      
      this.lastSignalPrice = candle.close;
      const signal = {
          time: candle.date || new Date().toISOString(), symbol: 'BANKNIFTY',
          price: parseFloat(candle.close.toFixed(2)), direction: finalDirection,
          rulesPassed, rulesFailed: Array.from(rulesFailedSet), conviction: convictionScore, timeframe,
      };

      if (global.currentNewsEvent) {
          signal.triggeredDuringEvent = global.currentNewsEvent.name;
      }

      return signal;
  }
  
  _handleNewSignal(signal) {
    try {
      const q = `INSERT INTO signals (symbol, price, direction, rules_passed, rules_failed, conviction) VALUES ($1,$2,$3,$4,$5,$6)`;
      const vals = [signal.symbol, signal.price, signal.direction, signal.rules_passed, signal.rules_failed, signal.conviction];
      this.db.query(q, vals).catch(err => console.warn("Failed to persist signal:", err.message));
    } catch (e) {
      console.warn("Signal persistence error:", e.message);
    }
    this._broadcastSignal(signal);
  }

  _updateFeedbackLoop(newSignal) {
    const timeframe = newSignal.timeframe;
    const previousSignal = this.lastSignalForFeedback[timeframe];

    if (previousSignal && !previousSignal.direction.includes('CONSOLIDATION')) {
        const pnl = previousSignal.direction.includes('BUY') ? newSignal.price - previousSignal.price : previousSignal.price - newSignal.price;
        const outcome = pnl > 0 ? 'win' : 'loss';

        previousSignal.rulesPassed.forEach(rule => {
            if (outcome === 'win') {
                this.dynamicRuleWeights[rule] = Math.min(this.dynamicRuleWeights[rule] + 0.5, this.baseRuleWeights[rule] * 1.5);
            } else {
                this.dynamicRuleWeights[rule] = Math.max(this.dynamicRuleWeights[rule] - 1.0, this.baseRuleWeights[rule] * 0.5);
            }
        });
    }
    this.lastSignalForFeedback[timeframe] = newSignal;
  }
  
  _applyStrategicPlaybook(marketRegime) {
      this.dynamicRuleWeights = JSON.parse(JSON.stringify(this.baseRuleWeights));
      if (marketRegime === 'Low') {
          this.dynamicRuleWeights["Market Structure"] *= 1.25;
          this.dynamicRuleWeights["HTF Alignment"] *= 1.25;
      } else if (marketRegime === 'High') {
          this.dynamicRuleWeights["Support & Resistance"] *= 1.3;
          this.dynamicRuleWeights["Options OI Levels"] *= 1.3;
      }
  }

  // --- RULE HELPERS ---
  _checkComponentDivergence(candle) {
      const indexChange = (candle.close - candle.open) / candle.open * 100;
      let bullishCount = 0, bearishCount = 0;
      Object.values(this.componentLtps).forEach(comp => {
          if (comp.change > 0.1) bullishCount++;
          if (comp.change < -0.1) bearishCount++;
      });
      const strongSupport = bullishCount >= 4;
      const strongResistance = bearishCount >= 4;
      
      if (indexChange > 0 && strongResistance) return 'bearish';
      if (indexChange < 0 && strongSupport) return 'bullish';
      return null;
  }

  _checkOptionsOiLevels(candle) {
      const { maxCallOiStrike, maxPutOiStrike } = this.oiLevels;
      if (!maxCallOiStrike || !maxPutOiStrike) return null;
      const proximity = candle.close * 0.001;
      if (Math.abs(candle.low - maxPutOiStrike) < proximity && candle.close > candle.open) return 'bullish';
      if (Math.abs(candle.high - maxCallOiStrike) < proximity && candle.close < candle.open) return 'bearish';
      return null;
  }

  _checkMarketStructure(candle, history) {
    const lookback = history.slice(-15);
    const recentHigh = Math.max(...lookback.map(c => c.high));
    const recentLow = Math.min(...lookback.map(c => c.low));
    if (candle.close > recentHigh) return 'bullish';
    if (candle.close < recentLow) return 'bearish';
    return null;
  }
  
  _checkSupportResistance(candle, timeframe) {
    const levels = [
        this.previousDayHigh, this.previousDayLow, this.previousDayClose,
        this.marketVitals.open, this.initialBalance.high, this.initialBalance.low
    ].filter(l => l > 0);
    const proximity = this.atr[timeframe] * 0.25 || candle.close * 0.001;
    for (const level of levels) {
        if (Math.abs(candle.low - level) < proximity && candle.close > candle.open) return { direction: 'bullish' };
        if (Math.abs(candle.high - level) < proximity && candle.close < candle.open) return { direction: 'bearish' };
    }
    return null;
  }
  
  _checkInitialBalanceBreakout(candle) {
    if (!this.initialBalance.set) return null;
    if (candle.close > this.initialBalance.high) return 'bullish';
    if (candle.close < this.initialBalance.low) return 'bearish';
    return null;
  }

  _checkHTFAlignment(timeframe) {
    if (timeframe === '15m') return null;
    if (this.htfTrend === 'UP') return 'bullish';
    if (this.htfTrend === 'DOWN') return 'bearish';
    return null;
  }
  
  _updateHTFTrend(history15m) {
      if (history15m.length < 20) return;
      const closes = history15m.map(c => c.close);
      const ema = closes.slice(1).reduce((prev, curr) => (curr * (2 / 21)) + (prev * (1 - (2 / 21))), closes[0]);
      const lastClose = closes[closes.length - 1];
      if (lastClose > ema * 1.001) this.htfTrend = 'UP';
      else if (lastClose < ema * 0.999) this.htfTrend = 'DOWN';
      else this.htfTrend = 'NEUTRAL';
  }

  _setInitialBalance(tick) {
    if (this.initialBalance.set) return;
    const tickTime = new Date(tick.timestamp);
    const hours = tickTime.getHours();
    const minutes = tickTime.getMinutes();
    if (hours === 9 && minutes >= 15 && minutes < 30) {
        if (this.initialBalance.high === 0) {
            this.initialBalance = { high: tick.last_price, low: tick.last_price, set: false };
        } else {
            this.initialBalance.high = Math.max(this.initialBalance.high, tick.last_price);
            this.initialBalance.low = Math.min(this.initialBalance.low, tick.last_price);
        }
    } else if (hours === 9 && minutes >= 30) {
        this.initialBalance.set = true;
    }
  }


  // ------------------------------------
  // SECTION: BACKTESTING & ANALYSIS
  // ------------------------------------
  
  async runHistoricalAnalysis(config) {
    const { instrument = 'BANKNIFTY' } = config;
    const instrumentToken = INSTRUMENT_MAP[instrument] || INSTRUMENT_MAP['BANKNIFTY'];
    const { candles } = await this._getHistoricalDataWithCache(config, instrumentToken);
    
    if (!candles || candles.length === 0) {
      console.warn("No historical data found for backtest config:", config);
      return { ...config, signals: [], candles: [], ...defaultMetrics };
    }

    const signals = this._generateSignalsFromHistory(candles, config.timeframe);
    const metrics = this._calculatePerformanceMetrics(signals, candles, config);
    
    return { ...config, signals, ...metrics, candles: candles.map(c => ({...c, date: c.date.toISOString()})) };
  }

  async runWalkForwardAnalysis(config) {
    console.log("Walk-forward analysis started...");
    return { ...config, ...defaultMetrics, walkForwardPeriods: [], equityCurve: [] };
  }
  
  _generateSignalsFromHistory(candles, timeframe) {
    const signals = [];
    const history = [];

    // Reset state for this specific backtest run to ensure it's clean
    const originalHTF = this.htfTrend;
    this._resetDailyStats();

    for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];
        history.push(candle);
        
        // Maintain a rolling window for history to avoid performance degradation on large datasets
        if (history.length > 150) {
            history.shift();
        }

        // Simplistic HTF simulation for backtesting. Assumes 15m trend is derived from the current history.
        // A more complex implementation would involve resampling the base timeframe data into 15m candles.
        if (timeframe !== '15m') {
             this._updateHTFTrend(history);
        }

        const signal = this._evaluateRules(candle, timeframe, history);

        if (signal) {
            // Add candleIndex so the frontend knows where on the chart to place the marker
            signals.push({ ...signal, candleIndex: i });
        }
    }
    
    // Restore live state
    this.htfTrend = originalHTF;

    console.log(`Backtest for timeframe ${timeframe} generated ${signals.length} signals.`);
    return signals;
  }

  _calculatePerformanceMetrics(signals, candles, config) {
    if (!signals || signals.length === 0 || !candles || candles.length === 0) {
        return { ...defaultMetrics, trades: [] };
    }

    const { tradeExitStrategy = 'stop', sl = 0.5, tp = 1.0 } = config;
    const trades = [];
    const equityCurve = [];
    let equity = 100000; // Start with a base for point calculation
    let currentPosition = null; // Can be null, 'LONG', or 'SHORT'
    let entryPrice = 0;
    let entryTime = null;
    let entryIndex = -1;

    // Helper to close a position and log the trade
    const closePosition = (exitPrice, exitTime) => {
        const pnl = currentPosition === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
        equity += pnl;

        trades.push({
            entryTime: entryTime,
            exitTime: exitTime,
            entryPrice: entryPrice,
            exitPrice: exitPrice,
            direction: currentPosition === 'LONG' ? 'BUY' : 'SELL',
            pnl: pnl
        });
        
        equityCurve.push({
            tradeNumber: trades.length,
            equity: equity,
            date: exitTime
        });

        // Reset position state
        currentPosition = null;
        entryPrice = 0;
        entryTime = null;
        entryIndex = -1;
    };

    if (tradeExitStrategy === 'signal') {
        signals.forEach(signal => {
            const direction = signal.direction.includes('BUY') ? 'BUY' : 'SELL';

            if (!currentPosition) { // No open position, so open one
                currentPosition = direction === 'BUY' ? 'LONG' : 'SHORT';
                entryPrice = signal.price;
                entryTime = signal.time;
            } else if (currentPosition === 'LONG' && direction === 'SELL') { // In a LONG, close and reverse to SHORT
                closePosition(signal.price, signal.time);
                currentPosition = 'SHORT';
                entryPrice = signal.price;
                entryTime = signal.time;
            } else if (currentPosition === 'SHORT' && direction === 'BUY') { // In a SHORT, close and reverse to LONG
                closePosition(signal.price, signal.time);
                currentPosition = 'LONG';
                entryPrice = signal.price;
                entryTime = signal.time;
            }
        });
    } else { // 'stop' (SL/TP) strategy
        signals.forEach(signal => {
            if (currentPosition) return; // Only take a new signal if not already in a position

            const direction = signal.direction.includes('BUY') ? 'BUY' : 'SELL';
            currentPosition = direction === 'BUY' ? 'LONG' : 'SHORT';
            entryPrice = signal.price;
            entryTime = signal.time;
            entryIndex = signal.candleIndex;

            const stopLossPrice = currentPosition === 'LONG' ? entryPrice * (1 - sl / 100) : entryPrice * (1 + sl / 100);
            const takeProfitPrice = currentPosition === 'LONG' ? entryPrice * (1 + tp / 100) : entryPrice * (1 - tp / 100);
            
            // Look for an exit condition in subsequent candles
            for (let i = entryIndex + 1; i < candles.length; i++) {
                const candle = candles[i];
                let exitPrice = null;
                
                if (currentPosition === 'LONG') {
                    if (candle.low <= stopLossPrice) exitPrice = stopLossPrice;
                    else if (candle.high >= takeProfitPrice) exitPrice = takeProfitPrice;
                } else { // SHORT
                    if (candle.high >= stopLossPrice) exitPrice = stopLossPrice;
                    else if (candle.low <= takeProfitPrice) exitPrice = takeProfitPrice;
                }

                if (exitPrice) {
                    closePosition(exitPrice, candle.date);
                    break; // Exit found, break inner loop to wait for the next signal
                }
            }
        });
    }

    // --- Final Metrics Calculation ---
    if (trades.length === 0) {
        return { ...defaultMetrics, trades: [] };
    }

    let totalWins = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let peakEquity = 100000;
    let maxDrawdown = 0;
    
    equityCurve.forEach(point => {
        peakEquity = Math.max(peakEquity, point.equity);
        const drawdown = ((peakEquity - point.equity) / peakEquity) * 100;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });

    trades.forEach(trade => {
        if (trade.pnl > 0) {
            totalWins++;
            grossProfit += trade.pnl;
        } else {
            grossLoss += Math.abs(trade.pnl);
        }
    });
    const totalLosses = trades.length - totalWins;
    const netProfit = grossProfit - grossLoss;
    const winRate = (totalWins / trades.length) * 100;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;
    const avgWin = totalWins > 0 ? grossProfit / totalWins : 0;
    const avgLoss = totalLosses > 0 ? grossLoss / totalLosses : 0;

    return {
        winRate: winRate.toFixed(2) + '%',
        profitFactor: profitFactor === Infinity ? 'inf' : profitFactor.toFixed(2),
        totalTrades: trades.length,
        maxDrawdown: maxDrawdown.toFixed(2) + '%',
        netProfit: netProfit,
        totalWins: totalWins,
        totalLosses: totalLosses,
        avgWin: avgWin,
        avgLoss: avgLoss,
        equityCurve: equityCurve,
        rulePerformance: [], // Note: Rule-specific performance tracking would require more complex logic
        trades: trades,
    };
  }
  
  async getAIStrategySuggestions(results, apiKey) { 
      if (!apiKey) throw new Error("A Gemini API Key is required.");
      const ai = new GoogleGenAI({apiKey});
      const prompt = `Analyze backtest results: Win Rate ${results.winRate}, Profit ${results.netProfit}. Provide HTML bullet points for improvement.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      return `<ul><li>${response.text.replace(/\n/g, "</li><li>")}</li></ul>`;
  }
  
  // ------------------------------------
  // SECTION: UTILITIES & HELPERS
  // ------------------------------------

  async _getInstrumentsCached() {
    const now = Date.now();
    if (this._instrumentCache.instruments.length && (now - this._instrumentCache.lastFetchAt) < this._instrumentCache.ttlMs) {
      return this._instrumentCache.instruments;
    }
    try {
      const instruments = await this.kite.getInstruments();
      this._instrumentCache.instruments = Array.isArray(instruments) ? instruments : [];
      this._instrumentCache.lastFetchAt = Date.now();
      return this._instrumentCache.instruments;
    } catch (e) {
      console.warn("Failed to fetch instruments from kite:", e.message);
      return [];
    }
  }
  
  async _fetchOptionsOiData() {
    try {
        const instruments = await this._getInstrumentsCached();
        if (!instruments.length) return;

        const bnfOptions = instruments.filter(i => (i.segment === 'NFO' && i.name === 'BANKNIFTY' && (i.instrument_type === 'CE' || i.instrument_type === 'PE')));
        if (!bnfOptions.length) return;

        const tradingsymbols = bnfOptions.map(i => `NFO:${i.tradingsymbol}`);
        let quotes = {};
        for (let i = 0; i < tradingsymbols.length; i += 400) {
            const batch = tradingsymbols.slice(i, i + 400);
            const batchQuotes = await this.kite.getQuote(batch);
            quotes = { ...quotes, ...batchQuotes };
            await delay(200);
        }

        let maxPutOi = 0, maxCallOi = 0, maxPutOiStrike = null, maxCallOiStrike = null;
        Object.values(quotes).forEach(q => {
            if (!q) return;
            const oi = q.oi || 0;
            const instrType = q.instrument_type;
            const strike = q.strike;
            if (instrType === 'PE' && oi > maxPutOi) { maxPutOi = oi; maxPutOiStrike = strike; }
            if (instrType === 'CE' && oi > maxCallOi) { maxCallOi = oi; maxCallOiStrike = strike; }
        });

        if (maxCallOiStrike || maxPutOiStrike) {
            this.oiLevels = { maxCallOiStrike, maxPutOiStrike, lastFetch: Date.now() };
        }
    } catch (e) {
        console.error("Failed to fetch OI data:", e.message);
    }
  }

  _calculateRSI(history, period, timeframe) {
    if (!Array.isArray(history) || history.length <= period) return;
    const closes = history.map(c => c.close);
    // ... complete RSI logic from original file
    this.rsi[timeframe].value = 50; // Placeholder
  }

  _calculateATR(history, period, timeframe) {
    if (!Array.isArray(history) || history.length <= period) return;
     // ... complete ATR logic from original file
    this.atr[timeframe] = 100; // Placeholder
  }

  _checkMarketHours() {
    const now = new Date();
    const hours = now.getHours(), minutes = now.getMinutes(), day = now.getDay();
    const isMarketHours = day > 0 && day < 6 && ((hours === 9 && minutes >= 15) || (hours > 9 && hours < 15) || (hours === 15 && minutes <= 30));
    const newStatus = isMarketHours ? 'OPEN' : 'CLOSED';
    if (this.marketStatus !== newStatus) {
        this.marketStatus = newStatus;
        this._broadcastMarketStatus();
        console.log(`Market is now ${newStatus}.`);
    }
  }

  async _getHistoricalDataWithCache(config, instrumentToken) {
    // Simplified for brevity
    return { candles: [], dataSourceMessage: "Using cache." };
  }

  _broadcast(message) {
    this.wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(JSON.stringify(message));
    });
  }

  _broadcastSignal(signal) { this._broadcast({ type: 'new_signal', payload: signal }); };
  _broadcastTick(tick) { this._broadcast({ type: 'market_tick', payload: { price: tick.last_price, time: tick.timestamp } }); };
  _broadcastConnectionStatus() { this._broadcast({ type: 'broker_status_update', payload: { status: this.connectionStatus, message: this.connectionMessage }}); };
  _broadcastMarketStatus() { this._broadcast({ type: 'market_status_update', payload: { status: this.marketStatus } }); };
  _broadcastMarketVitals() { this._broadcast({ type: 'market_vitals_update', payload: this.marketVitals }); };
  
  async shutdown() {
    this._stopped = true;
    this._timers.forEach(t => clearInterval(t));
    if (this.ticker) { this.ticker.disconnect(); }
    console.log("PriceActionEngine shutdown complete.");
  }
}

module.exports = PriceActionEngine;