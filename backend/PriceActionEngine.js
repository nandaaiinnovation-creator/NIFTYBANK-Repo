/**
 * LIVE IMPLEMENTATION: This engine is now configured for live data.
 * Ensure you have the 'kiteconnect' library installed in your backend.
 * Run: npm install kiteconnect
 */
const { KiteConnect } = require("kiteconnect");
const { KiteTicker } = require("kiteconnect");

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
    this.instrumentTokens = {
        'BANKNIFTY': 260105,
        // Add component stock tokens here if needed
    };
    this.candles = {}; // Stores in-memory 1-min candles for each instrument
    this.currentPrice = 0;
    this.previousPrice = 0;
    this.supportLevel = 0;
    this.resistanceLevel = 0;
    this.lastSignalPrice = 0;

    this.previousDayHigh = 0;
    this.previousDayLow = 0;
  }

  async connectToBroker(apiKey, accessToken) {
    console.log('Engine: Attempting to connect to broker...');

    // --- REAL IMPLEMENTATION ---
    try {
      this.kite = new KiteConnect({ api_key: apiKey });
      this.kite.setAccessToken(accessToken);

      const profile = await this.kite.getProfile();
      console.log(`Successfully connected as ${profile.user_name}`);

      await this._fetchPreMarketData();
      this._startLiveTicker();
    } catch (error) {
      console.error("Kite connection error:", error);
      throw new Error("Failed to connect to Zerodha. Check credentials.");
    }
  }
  
  async _fetchPreMarketData() {
    console.log("Fetching pre-market data (e.g., Previous Day H/L/C)...");
    // --- REAL IMPLEMENTATION ---
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 7); // Look back 7 days to ensure we get the last trading day

      const historicalData = await this.kite.getHistoricalData(this.instrumentTokens['BANKNIFTY'], "day", from, to);
      
      if (historicalData.length < 2) {
        throw new Error("Not enough historical data to determine previous day levels.");
      }

      // The last element is today's (incomplete) candle, the one before is the previous day.
      const prevDay = historicalData[historicalData.length - 2];
      this.previousDayHigh = prevDay.high;
      this.previousDayLow = prevDay.low;
      this.supportLevel = this.previousDayLow;
      this.resistanceLevel = this.previousDayHigh;
      console.log(`Pre-market data loaded: PDH=${this.previousDayHigh}, PDL=${this.previousDayLow}`);
    } catch (error) {
      console.error("Failed to fetch pre-market data:", error);
      throw new Error("Could not fetch essential pre-market data.");
    }
  }
  
  _startLiveTicker() {
    console.log("Initializing live ticker...");
    // --- REAL IMPLEMENTATION ---
    if (this.ticker) {
        console.log("Ticker already running. Disconnecting first.");
        this.ticker.disconnect();
    }

    this.ticker = new KiteTicker({
      api_key: this.kite.api_key,
      access_token: this.kite.access_token,
    });

    this.ticker.connect();
    this.ticker.on("connect", () => {
      console.log("Kite Ticker connected. Subscribing to instruments...");
      const tokens = Object.values(this.instrumentTokens);
      this.ticker.subscribe(tokens);
      this.ticker.setMode(this.ticker.modeFull, tokens);
    });

    this.ticker.on("ticks", (ticks) => {
      ticks.forEach(tick => {
        this._updateCandles(tick);
        if (tick.instrument_token === this.instrumentTokens['BANKNIFTY']) {
          this._processMarketTick(tick);
        }
      });
    });

    this.ticker.on("disconnect", (error) => console.log("Ticker disconnected:", error));
    this.ticker.on("error", (error) => console.log("Ticker error:", error));
    this.ticker.on("noreconnect", () => console.log("Ticker will not reconnect."));
  }

  _updateCandles(tick) {
    const minute = new Date(tick.timestamp).getMinutes();
    const token = tick.instrument_token;
    const price = tick.last_price;

    if (!this.candles[token] || this.candles[token].minute !== minute) {
      if (this.candles[token]) {
        // Optional: log candle close
      }

      this.candles[token] = {
        open: price,
        high: price,
        low: price,
        close: price,
        minute: minute,
        timestamp: tick.timestamp
      };
    } else {
      this.candles[token].high = Math.max(this.candles[token].high, price);
      this.candles[token].low = Math.min(this.candles[token].low, price);
      this.candles[token].close = price;
    }
  }

  _processMarketTick(tick) {
    if (!tick.tradable) return;
    
    this.previousPrice = this.currentPrice || tick.last_price;
    this.currentPrice = tick.last_price;

    // Broadcast every tick for the live chart
    this._broadcastTick(tick);

    const signal = this._evaluateRules(this.currentPrice);

    if (signal) {
      this.lastSignalPrice = signal.price;
      this._broadcastSignal(signal);
    }
  }
  
  _evaluateRules(price) {
    const passed = [];
    const failed = [];
    if (Math.abs(price - this.lastSignalPrice) < 50) return null; 

    // Rule: Breakout & Retest of Resistance
    if (price > this.resistanceLevel && this.previousPrice <= this.resistanceLevel) {
      passed.push("Breakout & Retest");
    }
    // Rule: Breakout & Retest of Support
    else if (price < this.supportLevel && this.previousPrice >= this.supportLevel) {
      passed.push("Breakout & Retest");
    } else {
      failed.push("Breakout & Retest");
    }
    
    // Rule: Reaction to Previous Day High/Low
    if (Math.abs(price - this.previousDayHigh) < 20 || Math.abs(price - this.previousDayLow) < 20) {
      passed.push("Previous Day Levels");
    } else {
      failed.push("Previous Day Levels");
    }
    
    if (passed.length < 1) return null;
    
    const direction = (price > this.resistanceLevel && price > this.previousDayHigh) ? 'BUY' : 
                      (price < this.supportLevel && price < this.previousDayLow) ? 'SELL' :
                      (passed.includes("Breakout & Retest") ? (price > this.resistanceLevel ? 'BUY' : 'SELL') : null);

    if (!direction) return null; // No clear directional bias
    
    let convictionScore = 50;
    passed.forEach(rule => { convictionScore += ruleWeights[rule] || 5; });
    convictionScore = Math.min(98, Math.floor(convictionScore));

    return {
      time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      symbol: 'BANKNIFTY',
      price: parseFloat(price.toFixed(2)),
      direction: direction,
      rulesPassed: passed,
      rulesFailed: failed,
      conviction: convictionScore,
    };
  }
  
  async _saveSignalToDb(signal) {
    const query = `
        INSERT INTO signals (symbol, price, direction, rules_passed, rules_failed, conviction)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [signal.symbol, signal.price, signal.direction, signal.rulesPassed, signal.rulesFailed, signal.conviction];
    try {
      await this.db.query(query, values);
      console.log('Signal saved to database.');
    } catch (error) {
      console.error('Error saving signal to database:', error);
    }
  }
  
  _broadcast(message) {
    if (!this.wss || this.wss.clients.size === 0) {
      return;
    };
    const stringifiedMessage = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN === 1
          client.send(stringifiedMessage);
      }
    });
  }

  async _broadcastSignal(signal) {
    await this._saveSignalToDb(signal); 
    this._broadcast({ type: 'new_signal', payload: signal });
    console.log("Signal broadcasted to connected clients.");
  }
  
  _broadcastTick(tick) {
    const payload = {
      price: tick.last_price,
      time: tick.timestamp
    };
    this._broadcast({ type: 'market_tick', payload });
  }
}

module.exports = PriceActionEngine;
