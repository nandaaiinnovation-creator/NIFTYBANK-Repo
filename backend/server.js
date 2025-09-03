require('dotenv').config(); // Load environment variables from .env file
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { Pool } = require('pg'); // Database client
const PriceActionEngine = require('./PriceActionEngine');

// --- DATABASE SETUP ---
// Connection string is now loaded from environment variables
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to create necessary tables if they don't exist
const initializeDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        symbol VARCHAR(50) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        rules_passed TEXT[],
        rules_failed TEXT[],
        conviction INTEGER NOT NULL
      );
    `);
    console.log('Table "signals" is ready.');

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_rule_configurations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL, -- Assuming one config per user
        config JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table "user_rule_configurations" is ready.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
    process.exit(1);
  }
};


console.log('Attempting to connect to the database...');
db.connect()
  .then(() => {
    console.log('Database connected successfully.');
    initializeDatabase();
  })
  .catch(err => {
    console.error('Database connection error. Ensure the database is running and the DATABASE_URL is correct in your .env file.', err.stack)
    process.exit(1);
  });

// --- SERVER SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8080;

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
    await engine.connectToBroker(apiKey, accessToken);
    res.status(200).json({ status: 'success', message: 'Successfully connected to broker.' });
  } catch (error) {
    console.error('Broker connection failed:', error.message);
    res.status(401).json({ status: 'error', message: error.message || 'Invalid API Key or Access Token.' });
  }
});

// --- MOCK DATA GENERATORS FOR BACKTEST ---
const generateMockCandles = (numCandles, startPrice) => {
    let price = startPrice;
    const candles = [];
    for (let i = 0; i < numCandles; i++) {
        const open = price;
        const change = (Math.random() - 0.48) * 100;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        candles.push({ id: i, open, high, low, close });
        price = close;
    }
    return candles;
};

const generateMockTrades = (numTrades, numCandles, candles) => {
    const trades = [];
    if (numCandles < 10) return [];
    for (let i = 0; i < numTrades; i++) {
        const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const entryIndex = Math.floor(Math.random() * (numCandles - 5));
        const exitIndex = entryIndex + Math.floor(Math.random() * 4) + 1;
        trades.push({
            type,
            entryIndex,
            exitIndex,
            entryPrice: candles[entryIndex].close,
            exitPrice: candles[exitIndex].close,
        });
    }
    return trades;
};


app.post('/api/backtest', (req, res) => {
    const { period } = req.body;
    console.log(`Running backtest for period: ${period}`);
    
    // Mock results based on the period
    const resultsMap = {
      '1': { period: "1 Year", winRate: "71.2%", profitFactor: "2.3", totalTrades: "151", maxDrawdown: "9.8%" },
      '3': { period: "3 Years", winRate: "68.5%", profitFactor: "2.1", totalTrades: "452", maxDrawdown: "12.3%" },
      '5': { period: "5 Years", winRate: "67.9%", profitFactor: "1.9", totalTrades: "743", maxDrawdown: "14.1%" }
    };
    
    const stats = resultsMap[period] || resultsMap['3'];
    const numCandles = 100;
    const candles = generateMockCandles(numCandles, 54000);
    const trades = generateMockTrades(8, numCandles, candles);

    const mockResults = { ...stats, candles, trades };
    
    setTimeout(() => res.status(200).json(mockResults), 1500); // Simulate delay
});

app.post('/api/rules', async (req, res) => {
  const rulesConfig = req.body;
  const userId = 1; // Hardcoded user_id

  console.log('Saving custom rule configuration for user:', userId);
  
  const query = `
    INSERT INTO user_rule_configurations (user_id, config)
    VALUES ($1, $2)
    ON CONFLICT (user_id)
    DO UPDATE SET config = EXCLUDED.config, updated_at = NOW();
  `;

  try {
    await db.query(query, [userId, JSON.stringify(rulesConfig)]);
    res.status(200).json({ status: 'success', message: 'Configuration saved.' });
  } catch (error) {
    console.error('Failed to save rules to database:', error);
    res.status(500).json({ status: 'error', message: 'Could not save configuration.' });
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
});
