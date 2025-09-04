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
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);

    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const day = istDate.getUTCDay(); // Sunday = 0, Saturday = 6

    let currentMarketStatus = 'CLOSED';
    if (day > 0 && day < 6) {
        const timeInMinutes = hours * 60 + minutes;
        const marketOpen = 9 * 60 + 15;
        const marketClose = 15 * 60 + 30;
        if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
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
            this.candles[tf] = { open: price, high: price, low: price, close: price, minute: minute };
        } else {
            this.candles[tf].high = Math.max(this.candles[tf].high, price);
            this.candles[tf].low = Math.min(this.candles[tf].low, price);
            this.candles[tf].close = price;
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
      time: new Date(candle.date || Date.now()).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
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

  async runHistoricalAnalysis(period, timeframe) {
    if (!this.kite) {
        throw new Error("Cannot run backtest: broker is not connected.");
    }

    console.log(`Running historical analysis for ${period} on ${timeframe} timeframe...`);
    const candles = await this._getHistoricalDataWithCache(period, timeframe);
    const signals = [];

    // To simulate pre-market data for each day in the test
    let currentPDH = 0;
    let currentPDL = 0;

    for (let i = 1; i < candles.length; i++) {
        const currentCandle = candles[i];
        const prevCandleAsDay = candles[i - 1]; // Use the previous candle for H/L levels

        this.previousDayHigh = prevCandleAsDay.high;
        this.previousDayLow = prevCandleAsDay.low;
        
        // Simple rule evaluation for backtesting
        const signal = this._evaluateRules(currentCandle, timeframe);
        if (signal) {
            signals.push({ ...signal, candleIndex: i });
        }
    }
    
    // Reset live pre-market data after backtest
    await this._fetchPreMarketData(); 
    
    console.log(`Backtest complete. Found ${signals.length} signals over ${candles.length} candles.`);
    
    return {
        period,
        timeframe,
        candles: candles.map((c, index) => ({ id: index, ...c })), // Add ID for frontend key
        signals,
    };
  }
  
  async _getHistoricalDataWithCache(period, timeframe) {
    const { from, to } = this._getDateRangeFromPeriod(period);
    const timeframeMap = { '1m': 'minute', '3m': '3minute', '5m': '5minute', '15m': '15minute' };
    const kiteTimeframe = timeframeMap[timeframe];
    if (!kiteTimeframe) throw new Error("Invalid timeframe for Kite API.");

    console.log(`Ensuring local data is up-to-date for ${timeframe} from ${from.toISOString()} to ${to.toISOString()}`);

    try {
        const apiData = await this.kite.getHistoricalData(this.instrumentToken, kiteTimeframe, from, to);
        console.log(`Fetched ${apiData.length} candles from Kite API for validation and caching.`);

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
                // Don't throw here, we can still try to use what's in the DB
            } finally {
                client.release();
            }
        }
    } catch (e) {
        console.error("Failed to fetch data from Kite API. Will proceed with locally cached data if available.", e.message);
        // If API fails, we don't want the whole backtest to fail. We can rely on existing cache.
    }
    
    console.log('Fetching complete dataset from local cache for analysis...');
    const selectQuery = `
        SELECT * FROM historical_candles
        WHERE instrument_token = $1 AND timeframe = $2 AND timestamp >= $3 AND timestamp <= $4
        ORDER BY timestamp ASC
    `;
    const { rows } = await this.db.query(selectQuery, [this.instrumentToken, timeframe, from, to]);
    
    if (rows.length === 0) {
        console.log('No historical data found locally or from API for this period.');
        throw new Error("No historical data available for the selected period. Check broker connection and API limits.");
    }

    console.log(`Proceeding to analysis with ${rows.length} candles from local cache.`);
    return rows.map(r => ({ ...r, date: new Date(r.timestamp) }));
  }

  _getDateRangeFromPeriod(period) {
      const to = new Date();
      const from = new Date();
      const [value, unit] = period.split(' ');

      if (unit.startsWith('month')) {
          from.setMonth(to.getMonth() - parseInt(value, 10));
      } else if (unit.startsWith('year')) {
          from.setFullYear(to.getFullYear() - parseInt(value, 10));
      }
      return { from, to };
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
    await this._saveSignalToDb(signal);
    this._logSignalToFile(signal);
    this._broadcast({ type: 'new_signal', payload: signal });
    console.log(`Signal (${signal.timeframe}) broadcasted to ${this.wss.clients.size} clients.`);
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