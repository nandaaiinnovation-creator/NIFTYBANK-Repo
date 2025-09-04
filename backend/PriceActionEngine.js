const { KiteConnect } = require("kiteconnect");
const { KiteTicker } = require("kiteconnect");
const fs = require('fs');
const path = require('path');
const signalsLogPath = path.join(__dirname, 'data', 'signals.log');
const ticksLogPath = path.join(__dirname, 'data', 'ticks.log');


const ruleWeights = {
    "Breakout & Retest": 15,
    "Market Structure": 10,
    "Volume Analysis": 8,
    "Support & Resistance": 12,
    "Candlestick Patterns": 5,
    "Consolidation Breakout": 14,
    "Previous Day Levels": 7
};

class PriceActionEngine {
  constructor(wss, db) {
    this.wss = wss;
    this.db = db;
    this.kite = null;
    this.ticker = null;
    
    // Market State
    this.instrumentToken = 260105; // BANKNIFTY
    this.timeframes = ['1m', '3m', '5m', '15m'];
    this.candles = {};
    this.timeframes.forEach(tf => this.candles[tf] = null);
    this.recentSignals = []; // For sentiment calculation

    this.currentPrice = 0;
    this.previousDayHigh = 0;
    this.previousDayLow = 0;
    this.lastSignalPrice = 0;

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
      this._startLiveTicker();
    } catch (error) {
      console.error("Kite connection error:", error);
      this.connectionStatus = 'error';
      this.connectionMessage = 'Failed to connect. Check credentials.';
      this._broadcastConnectionStatus();
      throw new Error("Failed to connect to Zerodha. Check credentials.");
    }
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
      this.ticker.subscribe([this.instrumentToken]);
      this.ticker.setMode(this.ticker.modeFull, [this.instrumentToken]);
      this.connectionStatus = 'connected';
      this.connectionMessage = 'Live data feed active.';
      this._broadcastConnectionStatus();
      this._checkMarketHours(); // Initial check on connect
    });

    this.ticker.on("ticks", (ticks) => {
      ticks.forEach(tick => {
        if (tick.instrument_token === this.instrumentToken) {
          this._processMarketTick(tick);
        }
      });
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
    // Use UTC for server-side logic to avoid timezone issues.
    // IST is UTC+5:30
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const day = now.getUTCDay();

    let currentMarketStatus = 'CLOSED';
    // Indian Market: Monday (1) to Friday (5)
    if (day > 0 && day < 6) {
        // Market Open: 9:15 AM IST = 3:45 AM UTC
        // Market Close: 3:30 PM IST = 10:00 AM UTC
        const timeInUTCMinutes = hours * 60 + minutes;
        const marketOpenUTC = 3 * 60 + 45;
        const marketCloseUTC = 10 * 60;
        if (timeInUTCMinutes >= marketOpenUTC && timeInUTCMinutes <= marketCloseUTC) {
            currentMarketStatus = 'OPEN';
        }
    }
    
    if (this.marketStatus !== currentMarketStatus) {
        this.marketStatus = currentMarketStatus;
        console.log(`Market status changed to: ${this.marketStatus}`);
        this._broadcastMarketStatus();
    }
  }

  _processMarketTick(tick) {
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
                const closedCandle = { ...this.candles[tf] };
                const signal = this._evaluateRules(closedCandle, tf);
                if (signal) this._broadcastSignal(signal);
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
  
  _evaluateRules(candle, timeframe) {
    const passed = [];
    const failed = [];
    if (candle.close > this.previousDayHigh && candle.open <= this.previousDayHigh) passed.push("Previous Day Levels");
    else if (candle.close < this.previousDayLow && candle.open >= this.previousDayLow) passed.push("Previous Day Levels");
    else failed.push("Previous Day Levels");

    const bodySize = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    if (range > 0 && bodySize / range > 0.7) passed.push("Candlestick Patterns");
    else failed.push("Candlestick Patterns");
    
    if (Math.abs(candle.close - this.lastSignalPrice) < 75) return null;
    if (passed.length < 1) return null;
    
    const direction = candle.close > candle.open ? 'BUY' : 'SELL';
    let convictionScore = 50;
    passed.forEach(rule => { convictionScore += ruleWeights[rule] || 5; });
    convictionScore = Math.min(98, Math.floor(convictionScore));
    this.lastSignalPrice = candle.close;

    return {
      time: candle.date || new Date().toISOString(),
      symbol: 'BANKNIFTY',
      price: parseFloat(candle.close.toFixed(2)),
      direction: direction,
      rulesPassed: passed,
      rulesFailed: failed,
      conviction: convictionScore,
      timeframe: timeframe,
    };
  }

  // --- BACKTESTING LOGIC ---

  async runHistoricalAnalysis(config) {
    const { period, timeframe, from, to, metricsOnly } = config;
    if (!this.kite) {
        throw new Error("Cannot run backtest: broker is not connected.");
    }

    console.log(`Running historical analysis for ${period || 'custom range'} on ${timeframe} timeframe...`);
    
    const { candles, dataSourceMessage } = await this._getHistoricalDataWithCache(config);
    const signals = [];

    for (let i = 1; i < candles.length; i++) {
        const currentCandle = candles[i];
        const prevCandleAsDay = candles[i - 1]; // Use the previous candle for H/L levels

        this.previousDayHigh = prevCandleAsDay.high;
        this.previousDayLow = prevCandleAsDay.low;
        
        const signal = this._evaluateRules(currentCandle, timeframe);
        if (signal) {
            signals.push({ ...signal, candleIndex: i });
        }
    }
    
    await this._fetchPreMarketData(); 
    
    console.log(`Backtest found ${signals.length} signals over ${candles.length} candles.`);
    
    const metrics = this._calculatePerformanceMetrics(signals, candles);

    const totalTrades = metrics.wins + metrics.losses;
    const winRate = totalTrades > 0 ? ((metrics.wins / totalTrades) * 100).toFixed(1) + '%' : '0.0%';
    const profitFactor = metrics.totalLoss > 0 ? (metrics.totalProfit / metrics.totalLoss).toFixed(2) : 'N/A';
    const maxDrawdown = (metrics.maxDrawdown * 100).toFixed(2) + '%';
    
    const response = {
        period: period || 'Custom Range',
        timeframe: timeframe,
        signals,
        dataSourceMessage,
        winRate,
        profitFactor,
        totalTrades: totalTrades,
        maxDrawdown,
    };
    
    if (!metricsOnly) {
        response.candles = candles.map((c, index) => ({ id: index, ...c, date: c.date.toISOString() }));
    }

    return response;
  }
  
  async _getHistoricalDataWithCache(config) {
    const { period, timeframe, from, to } = config;
    const { fromDate, toDate } = this._getDateRange(period, from, to);
    
    const timeframeMap = { '1m': 'minute', '3m': '3minute', '5m': '5minute', '15m': '15minute' };
    const kiteTimeframe = timeframeMap[timeframe];
    if (!kiteTimeframe) throw new Error("Invalid timeframe for Kite API.");
    
    let dataSourceMessage = '';

    console.log(`Ensuring local data is up-to-date for ${timeframe} from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    try {
        const apiData = await this.kite.getHistoricalData(this.instrumentToken, kiteTimeframe, fromDate, toDate);
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
                    await client.query(insertQuery, [this.instrumentToken, timeframe, candle.date, candle.open, candle.high, candle.low, candle.close, candle.volume]);
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
    const { rows } = await this.db.query(selectQuery, [this.instrumentToken, timeframe, fromDate, toDate]);
    
    if (rows.length === 0) {
        console.log('No historical data found locally or from API for this period.');
        throw new Error("No historical data available for the selected period. Check broker connection and API limits.");
    }

    console.log(`Proceeding to analysis with ${rows.length} candles from local cache.`);
    const candles = rows.map(r => ({ ...r, date: new Date(r.timestamp) }));
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


  // --- ML & PERFORMANCE ANALYSIS ---

  _calculatePerformanceMetrics(signals, candles) {
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    
    let equity = 100000;
    let peakEquity = equity;
    let maxDrawdown = 0;

    signals.forEach(signal => {
        const entryPrice = signal.price;
        const entryIndex = signal.candleIndex;
        const stopLoss = signal.direction === 'BUY' ? entryPrice * 0.995 : entryPrice * 1.005; // 0.5%
        const takeProfit = signal.direction === 'BUY' ? entryPrice * 1.01 : entryPrice * 0.99; // 1%

        let outcome = 'undetermined';
        let exitPrice = entryPrice;

        for (let i = entryIndex + 1; i < candles.length; i++) {
            const candle = candles[i];
            
            if (signal.direction === 'BUY') {
                if (candle.high >= takeProfit) { outcome = 'win'; exitPrice = takeProfit; break; }
                if (candle.low <= stopLoss) { outcome = 'loss'; exitPrice = stopLoss; break; }
            } else { // SELL
                if (candle.low <= takeProfit) { outcome = 'win'; exitPrice = takeProfit; break; }
                if (candle.high >= stopLoss) { outcome = 'loss'; exitPrice = stopLoss; break; }
            }
        }
        
        if (outcome === 'undetermined') {
            exitPrice = candles[candles.length - 1].close;
            outcome = (signal.direction === 'BUY' && exitPrice > entryPrice) || (signal.direction === 'SELL' && exitPrice < entryPrice) ? 'win' : 'loss';
        }

        const pnl = signal.direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
        const pnlPercentage = (pnl / entryPrice);
        equity += equity * pnlPercentage;

        if (equity > peakEquity) {
            peakEquity = equity;
        }

        const drawdown = (peakEquity - equity) / peakEquity;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
        
        if (pnl > 0) {
            wins++;
            totalProfit += pnl;
        } else {
            losses++;
            totalLoss += Math.abs(pnl);
        }
    });

    return { wins, losses, totalProfit, totalLoss, peakEquity, maxDrawdown };
  }

  async analyzeSignalPerformance(config = {}) {
      const { sl = 0.5, tp = 1.0 } = config; // Defaults if not provided
      console.log(`Starting signal performance analysis with SL=${sl}% and TP=${tp}%...`);
      
      const now = new Date();
      // Use UTC for server-side time calculations to be timezone-agnostic
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
          return {
              rule,
              ...stats,
              winRate: total > 0 ? ((stats.wins / total) * 100).toFixed(2) + '%' : '0.00%'
          };
      }).sort((a,b) => (b.wins + b.losses) - (a.wins + a.losses));

      console.log("Analysis complete:", { totalSignals, wins, losses, winRate });
      return { totalSignals, wins, losses, winRate, rulePerformance };
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
    // Add to recent signals for sentiment calculation
    this.recentSignals.unshift(signal);
    if (this.recentSignals.length > 20) {
      this.recentSignals.pop();
    }
    
    await this._saveSignalToDb(signal);
    this._logSignalToFile(signal);
    this._broadcast({ type: 'new_signal', payload: signal });
    console.log(`Signal (${signal.timeframe}) broadcasted to ${this.wss.clients.size} clients.`);
    
    // Calculate and broadcast sentiment after every new signal
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
}

module.exports = PriceActionEngine;