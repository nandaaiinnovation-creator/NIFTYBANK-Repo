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
      // Zerodha requires instrument token, interval, from and to dates
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
      // It's critical to handle this, as rules might depend on it.
      // We could either stop or proceed with default/zero values.
      throw new Error("Could not fetch essential pre-market data.");
    }
  }
  
  _startLiveTicker() {
    console.log("Initializing live ticker...");
    // --- REAL IMPLEMENTATION ---
    this.ticker = new KiteTicker({
      api_key: this.kite.api_key,
      access_token: this.kite.access_token,
    });

    this.ticker.connect();
    this.ticker.on("connect", () => {
      console.log("Kite Ticker connected. Subscribing to instruments...");
      const tokens = Object.values(this.instrumentTokens);
      this.ticker.subscribe(tokens);
      // Set mode to 'full' to get detailed tick data including OHLC
      this.ticker.setMode(this.ticker.modeFull, tokens);
    });

    this.ticker.on("ticks", (ticks) => {
      // Process incoming ticks
      ticks.forEach(tick => {
        this._updateCandles(tick);
        // Only run the main engine logic for the BANKNIFTY index
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
      // New candle begins. The previous candle is now complete.
      // Here you could trigger rules that evaluate on candle close.
      if (this.candles[token]) {
        console.log(`1-min candle closed for ${token}: O:${this.candles[token].open}, H:${this.candles[token].high}, L:${this.candles[token].low}, C:${this.candles[token].close}`);
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
      // Update existing candle
      this.candles[token].high = Math.max(this.candles[token].high, price);
      this.candles[token].low = Math.min(this.candles[token].low, price);
      this.candles[token].close = price;
    }
  }

  _processMarketTick(tick) {
    if (!tick.tradable) return;
    
    this.previousPrice = this.currentPrice || tick.last_price;
    this.currentPrice = tick.last_price;

    const signal = this._evaluateRules(this.currentPrice);

    if (signal) {
      this.lastSignalPrice = signal.price;
      this._broadcastSignal(signal);
    }
  }
  
  _evaluateRules(price) {
    const passed = [];
    const failed = []; // Track failed rules for more detailed signals
    // Signal cooldown: Don't generate a new signal if it's too close to the last one.
    if (Math.abs(price - this.lastSignalPrice) < 50) return null; 

    // Rule: Breakout & Retest of Resistance
    if (price > this.resistanceLevel && this.previousPrice <= this.resistanceLevel) {
      passed.push("Breakout & Retest");
    }
    // Rule: Breakout & Retest of Support
    if (price < this.supportLevel && this.previousPrice >= this.supportLevel) {
      passed.push("Breakout & Retest");
    }
    // Rule: Reaction to Previous Day High/Low
    if (Math.abs(price - this.previousDayHigh) < 20 || Math.abs(price - this.previousDayLow) < 20) {
      passed.push("Previous Day Levels");
    }
    
    // Add more advanced rule evaluations here using this.candles data
    
    if (passed.length < 1) return null; // Only generate signal if at least one rule passes
    
    const direction = price > this.resistanceLevel ? 'BUY' : 'SELL';
    
    let convictionScore = 50; // Base score
    passed.forEach(rule => { convictionScore += ruleWeights[rule] || 5; });
    convictionScore = Math.min(98, Math.floor(convictionScore)); // Cap conviction at 98%

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
        INSERT INTO signals (symbol, price, direction, rules_passed, conviction)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [signal.symbol, signal.price, signal.direction, signal.rulesPassed, signal.conviction];
    try {
      await this.db.query(query, values);
      console.log('Signal saved to database.');
    } catch (error) {
      console.error('Error saving signal to database:', error);
    }
  }

  async _broadcastSignal(signal) {
    // IMPORTANT: First, save the signal to the database to ensure persistence.
    await this._saveSignalToDb(signal); 
    
    if (!this.wss || this.wss.clients.size === 0) {
        console.log("No clients connected to WebSocket. Signal was saved but not broadcasted.");
        return;
    };
    
    const message = JSON.stringify({ type: 'new_signal', payload: signal });
    this.wss.clients.forEach((client) => {
      // Check if client is ready before sending
      if (client.readyState === 1) { // WebSocket.OPEN === 1
          client.send(message);
      }
    });
    console.log("Signal broadcasted to connected clients.");
  }
}

module.exports = PriceActionEngine;
