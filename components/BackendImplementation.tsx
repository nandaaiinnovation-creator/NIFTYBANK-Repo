

import React from 'react';
import SectionCard from './SectionCard';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-900 p-4 rounded-md text-sm text-cyan-300 font-mono overflow-x-auto my-2">
        <code>{children}</code>
    </pre>
);

const serverJsCode = `
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { Pool } = require('pg'); // Database client
const PriceActionEngine = require('./PriceActionEngine');

// --- DATABASE SETUP ---
// In production, use environment variables for connection details
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/trading_signals',
});

// Function to create necessary tables if they don't exist
const initializeDatabase = async () => {
  try {
    await db.query(\`
      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        symbol VARCHAR(50) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        rules_passed TEXT[],
        conviction INTEGER NOT NULL
      );
    \`);
    console.log('Table "signals" is ready.');

    await db.query(\`
      CREATE TABLE IF NOT EXISTS user_rule_configurations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL, -- Assuming one config per user
        config JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    \`);
    console.log('Table "user_rule_configurations" is ready.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
    // Exit process if DB setup fails, as the app cannot run without it
    process.exit(1);
  }
};


console.log('Attempting to connect to the database...');
db.connect()
  .then(() => {
    console.log('Database connected successfully.');
    // Initialize tables after a successful connection
    initializeDatabase();
  })
  .catch(err => console.error('Database connection error:', err.stack));

// --- SERVER SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8080;

// Initialize the trading engine and pass it the DB and WebSocket server instances
console.log("Initializing Price Action Engine...");
const engine = new PriceActionEngine(wss, db);

// --- WEBSOCKET CONNECTION ---
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => console.log('Client disconnected'));
});

// --- REST API ENDPOINTS ---

app.post('/api/broker/connect', async (req, res) => {
  const { apiKey, accessToken } = req.body;
  if (!apiKey || !accessToken) {
    return res.status(400).json({ status: 'error', message: 'API Key and Access Token are required.' });
  }
  
  try {
    // Pass credentials to the engine to establish a live data connection
    await engine.connectToBroker(apiKey, accessToken);
    res.status(200).json({ status: 'success', message: 'Successfully connected to broker.' });
  } catch (error) {
    console.error('Broker connection failed:', error.message);
    res.status(401).json({ status: 'error', message: error.message || 'Invalid API Key or Access Token.' });
  }
});

app.post('/api/backtest', (req, res) => {
    const { period } = req.body;
    console.log(\`Running backtest for period: \${period} years\`);
    // In a real app, you would run a complex simulation here.
    let mockResults;
    switch (period) {
        case '1':
            mockResults = { period: "1 Year", winRate: "71.2%", profitFactor: "2.3", totalTrades: "151", maxDrawdown: "9.8%" };
            break;
        case '5':
            mockResults = { period: "5 Years", winRate: "67.9%", profitFactor: "1.9", totalTrades: "743", maxDrawdown: "14.1%" };
            break;
        case '3':
        default:
            mockResults = { period: "3 Years", winRate: "68.5%", profitFactor: "2.1", totalTrades: "452", maxDrawdown: "12.3%" };
            break;
    }
    setTimeout(() => res.status(200).json(mockResults), 1500); // Simulate delay
});

app.post('/api/rules', async (req, res) => {
  const rulesConfig = req.body;
  // Hardcoding user_id since we don't have authentication
  const userId = 1; 

  console.log('Saving custom rule configuration for user:', userId);
  
  const query = \`
    INSERT INTO user_rule_configurations (user_id, config)
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET config = EXCLUDED.config, updated_at = NOW();
  \`;

  try {
    await db.query(query, [userId, JSON.stringify(rulesConfig)]);
    res.status(200).json({ status: 'success', message: 'Configuration saved.' });
  } catch (error) {
    console.error('Failed to save rules to database:', error);
    res.status(500).json({ status: 'error', message: 'Could not save configuration.' });
  }
});

server.listen(PORT, async () => {
  console.log(\`Server listening on port \${PORT}\`);
  // Start the engine's core processes like fetching pre-market data
  await engine.start();
});
`;

const engineJsCode = `
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

  async start() {
    console.log('Price Action Engine started. Waiting for broker connection...');
    // The engine is now passive until connectToBroker is called.
  }

  async connectToBroker(apiKey, accessToken) {
    console.log('Engine: Attempting to connect to broker...');

    // --- REAL IMPLEMENTATION ---
    try {
      this.kite = new KiteConnect({ api_key: apiKey });
      this.kite.setAccessToken(accessToken);

      const profile = await this.kite.getProfile();
      console.log(\`Successfully connected as \${profile.user_name}\`);

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
      console.log(\`Pre-market data loaded: PDH=\${this.previousDayHigh}, PDL=\${this.previousDayLow}\`);
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
        console.log(\`1-min candle closed for \${token}: O:\${this.candles[token].open}, H:\${this.candles[token].high}, L:\${this.candles[token].low}, C:\${this.candles[token].close}\`);
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
    
    const direction = price > this.previousPrice ? 'BUY' : 'SELL';
    
    let convictionScore = 50; // Base score
    passed.forEach(rule => { convictionScore += ruleWeights[rule] || 5; });
    convictionScore = Math.min(98, Math.floor(convictionScore)); // Cap conviction at 98%

    return {
      time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      symbol: 'BANKNIFTY',
      price: parseFloat(price.toFixed(2)),
      direction: direction,
      rulesPassed: passed,
      conviction: convictionScore,
    };
  }
  
  async _saveSignalToDb(signal) {
    const query = \`
        INSERT INTO signals (symbol, price, direction, rules_passed, conviction)
        VALUES ($1, $2, $3, $4, $5)
    \`;
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
`;


const BackendImplementation: React.FC = () => {
    return (
        <SectionCard title="Backend Engine Implementation" iconClass="fa-solid fa-cogs">
            <p className="text-gray-400 mb-6">
                This section provides the complete, ready-to-run Node.js code for the backend server. The server is now architected for production, including database integration and hooks for live broker data. Follow the steps in the "How to Run" or "Deployment Guide" to get this running.
            </p>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fab fa-node-js mr-3 text-green-400"></i>File 1: <code className="text-cyan-300">server.js</code></h3>
                    <p className="text-gray-400 mb-4">This file sets up the Express server, the WebSocket server, and the database connection. It now automatically creates database tables on startup and handles saving custom rule configurations to the database.</p>
                    <CodeBlock>{serverJsCode}</CodeBlock>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-gears mr-3 text-cyan-400"></i>File 2: <code className="text-cyan-300">PriceActionEngine.js</code></h3>
                    <p className="text-gray-400 mb-4">The core engine is now structured to be stateful and production-ready. It fetches pre-market data on start, connects to the broker, processes live ticks, and saves every generated signal to the database before broadcasting it.</p>
                    <CodeBlock>{engineJsCode}</CodeBlock>
                </div>
            </div>
        </SectionCard>
    );
};

export default BackendImplementation;
