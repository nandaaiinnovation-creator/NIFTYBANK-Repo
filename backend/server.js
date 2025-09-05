require('dotenv').config();
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { Pool } = require('pg');
const PriceActionEngine = require('./PriceActionEngine');
const NewsEngine = require('./NewsEngine');

// Global error handlers (helpful in production)
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', err => {
  console.error('Uncaught Exception thrown:', err);
  // consider graceful shutdown if necessary
});

// --- GLOBAL STATE ---
global.currentNewsEvent = null;

// --- DATABASE SETUP ---
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initializeDatabase = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        symbol VARCHAR(50) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        direction VARCHAR(20) NOT NULL,
        rules_passed TEXT[],
        rules_failed TEXT[],
        conviction INTEGER NOT NULL
      );
    `);
    console.log('Table "signals" is ready.');

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_rule_configurations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table "user_rule_configurations" is ready.');

    await db.query(`
      CREATE TABLE IF NOT EXISTS historical_candles (
        id SERIAL PRIMARY KEY,
        instrument_token INTEGER NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        open NUMERIC(10, 2) NOT NULL,
        high NUMERIC(10, 2) NOT NULL,
        low NUMERIC(10, 2) NOT NULL,
        close NUMERIC(10, 2) NOT NULL,
        volume BIGINT,
        UNIQUE(instrument_token, timeframe, timestamp)
      );
    `);
    console.log('Table "historical_candles" is ready.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
    throw err;
  }
};

(async () => {
  console.log('Attempting to connect to the database...');
  try {
    // test connection
    await db.query('SELECT 1');
    console.log('Database connected successfully.');
    await initializeDatabase();
  } catch (err) {
    console.error('Database connection error. Ensure the database is running and the DATABASE_URL is correct in your .env file.', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();

// --- SERVER SETUP ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// health endpoint for docker-compose
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error', detail: e && e.message ? e.message : e });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8080;

console.log("Initializing Engines...");
const priceActionEngine = new PriceActionEngine(wss, db);
const newsEngine = new NewsEngine(wss);

// Websocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => console.log('Client disconnected'));
});

// REST API Endpoints
app.post('/api/broker/connect', async (req, res) => {
  const { apiKey, accessToken } = req.body;
  if (!apiKey || !accessToken) {
    return res.status(400).json({ status: 'error', message: 'API Key and Access Token are required.' });
  }

  try {
    await priceActionEngine.connectToBroker(apiKey, accessToken);
    res.status(200).json({ status: 'success', message: 'Successfully connected to broker.' });
  } catch (error) {
    console.error('Broker connection failed:', error && error.message ? error.message : error);
    res.status(401).json({ status: 'error', message: error && error.message ? error.message : 'Invalid API Key or Access Token.' });
  }
});

app.post('/api/backtest', async (req, res) => {
  const { mode = 'simple' } = req.body;
  console.log(`Received backtest request with mode: ${mode}`);
  try {
    let results;
    if (mode === 'walk-forward') {
      results = await priceActionEngine.runWalkForwardAnalysis(req.body);
    } else {
      results = await priceActionEngine.runHistoricalAnalysis(req.body);
    }
    res.status(200).json(results);
  } catch (error) {
    console.error(`Backtest failed on server (mode: ${mode}):`, error && error.message ? error.message : error);
    if (error && error.message && error.message.includes("broker is not connected")) {
      return res.status(400).json({ status: 'error', message: 'Broker is not connected. Please connect on the main dashboard first.' });
    }
    res.status(500).json({ status: 'error', message: error && error.message ? error.message : 'An error occurred during the backtest.' });
  }
});

app.post('/api/rules', async (req, res) => {
  const rulesConfig = req.body;
  const userId = 1;
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
    console.error('Failed to save rules to database:', error && error.message ? error.message : error);
    res.status(500).json({ status: 'error', message: 'Could not save configuration.' });
  }
});

app.post('/api/ml/analyze-signals', async (req, res) => {
  const analysisConfig = req.body;
  console.log('Received request to analyze signal performance with config:', analysisConfig);
  try {
    const results = await priceActionEngine.analyzeSignalPerformance(analysisConfig);
    res.status(200).json(results);
  } catch (error) {
    console.error("Signal performance analysis failed on server:", error && error.message ? error.message : error);
    res.status(500).json({ status: 'error', message: error && error.message ? error.message : 'An error occurred during signal analysis.' });
  }
});

app.post('/api/ml/suggest-strategy', async (req, res) => {
  const { results: backtestResults, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ status: 'error', message: 'A Gemini API Key is required for this feature.' });
  }
  if (!backtestResults) {
    return res.status(400).json({ status: 'error', message: 'Backtest results are required.' });
  }

  console.log('Received request for AI strategy suggestions.');
  try {
    const suggestions = await priceActionEngine.getAIStrategySuggestions(backtestResults, apiKey);
    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("AI suggestion generation failed:", error && error.message ? error.message : error);
    res.status(500).json({ status: 'error', message: error && error.message ? error.message : 'Failed to get suggestions from AI.' });
  }
});

app.post('/api/news/initialize', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ status: 'error', message: 'Alpha Vantage API Key is required.' });
  }
  try {
    await newsEngine.initializeForDay(apiKey);
    res.status(200).json({ status: 'success', message: 'News Engine initialized and monitoring.' });
  } catch (error) {
    console.error("News Engine initialization failed:", error && error.message ? error.message : error);
    res.status(500).json({ status: 'error', message: error && error.message ? error.message : 'Failed to initialize News Engine.' });
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
});
