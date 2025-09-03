import React from 'react';
import { SignalDirection } from './types';
import type { Signal, TradingRule, TechStackItem, Section } from './types';

export const sections: Section[] = [
    { id: 'overview', title: 'Overview', iconClass: 'fa-solid fa-book-open' },
    { id: 'broker-integration', title: 'Broker Integration', iconClass: 'fa-solid fa-link' },
    { id: 'live-signals', title: 'Live Signals', iconClass: 'fa-solid fa-tower-broadcast' },
    { id: 'functional-requirements', title: 'Functional Requirements', iconClass: 'fa-solid fa-list-check' },
    { id: 'data-sources', title: 'Data Sources', iconClass: 'fa-solid fa-database' },
    { id: 'trading-logic', title: 'Trading Logic & Rules', iconClass: 'fa-solid fa-gears' },
    { id: 'rule-customizer', title: 'Rule Customizer', iconClass: 'fa-solid fa-sliders' },
    { id: 'ml-integration', title: 'ML Smart Signals', iconClass: 'fa-solid fa-brain' },
    { id: 'predictive-ml', title: 'Predictive ML Forecasts', iconClass: 'fa-solid fa-wand-magic-sparkles' },
    { id: 'backtesting', title: 'Backtesting', iconClass: 'fa-solid fa-backward-fast' },
    { id: 'signal-structure', title: 'Signal Notification', iconClass: 'fa-solid fa-message' },
    { id: 'ui-design', title: 'UI Design', iconClass: 'fa-solid fa-palette' },
    { id: 'tech-stack', title: 'Technology Stack', iconClass: 'fa-solid fa-microchip' },
    { id: 'api-specification', title: 'API Specification', iconClass: 'fa-solid fa-code-branch' },
    { id: 'backend-implementation', title: 'Backend Implementation', iconClass: 'fa-solid fa-cogs' },
    { id: 'deployment-guide', title: 'Deployment Guide', iconClass: 'fa-brands fa-docker' },
    { id: 'sentiment-analysis', title: 'Market Sentiment', iconClass: 'fa-solid fa-magnifying-glass-chart' },
    { id: 'feedback-mechanism', title: 'Post-Market Feedback', iconClass: 'fa-solid fa-book' },
    { id: 'how-to-run', title: 'How to Run', iconClass: 'fa-solid fa-terminal' },
    { id: 'recommendations', title: 'Recommendations', iconClass: 'fa-solid fa-rocket' },
];

export const tradingRules: TradingRule[] = [
  { title: "Previous Day Levels", description: "Price reaction to previous day's High, Low, and Close." },
  { title: "Support & Resistance", description: "Interaction with key zones: Prev H/L/C, Today's Open, IB H/L." },
  { title: "Candlestick Patterns", description: "Identifies patterns like Engulfing, Pin Bars, and Inside Bars." },
  { title: "Breakout & Retest", description: "Detects breakouts from key levels and subsequent retests." },
  { title: "Market Structure", description: "Analyzes trends (Higher Highs/Lows or Lower Highs/Lows)." },
  { title: "Momentum Divergence", description: "Mismatch between price momentum and an oscillator (e.g., RSI)." },
  { title: "Volume Analysis", description: "Flags unusual volume spikes indicating strong participation." },
  { title: "Options OI Levels", description: "Identifies significant Open Interest levels acting as S/R." },
  { title: "Component Divergence", description: "Checks alignment of BankNIFTY with its heavyweight components." },
  { title: "Consolidation Breakout", description: "Detects breakouts from periods of tight price consolidation." },
  { title: "Trend Strength", description: "Filters signals based on the strength of the prevailing trend (e.g., ADX)." },
  { title: "Initial Balance Breakout", description: "Price crossing the High/Low of the first 15 minutes of trading." },
  { title: "Multi-Timeframe Analysis", description: "Correlates signals across multiple timeframes (e.g., 5-min, 15-min)." },
];

const ReactIcon = <i className="fab fa-react text-cyan-400 text-2xl"></i>;
const TSIcon = <svg className="w-6 h-6" viewBox="0 0 128 128"><path fill="#3178c6" d="M0 0h128v128H0z"></path><path fill="#fff" d="M30.34 89.13h15.28V43.83h23.23v-11.5H30.34v56.8zM100.08 89.13h11.52V64.67h.33c1.78 3.82 5.25 9.15 12.08 12.07l5.63-10.2c-4.99-2.22-8.39-5.45-10.13-8.62h.33V43.83H100.08v45.3z"></path></svg>;
const TailwindIcon = <i className="fas fa-wind text-teal-400 text-2xl"></i>;
const NodeIcon = <i className="fab fa-node-js text-green-500 text-2xl"></i>;
const WebSocketIcon = <i className="fas fa-network-wired text-blue-400 text-2xl"></i>;
const DatabaseIcon = <i className="fas fa-database text-indigo-400 text-2xl"></i>;


export const frontendTech: TechStackItem[] = [
    { name: "React & TypeScript", description: "For building a robust, type-safe, and interactive user interface.", icon: ReactIcon },
    { name: "Tailwind CSS", description: "A utility-first CSS framework for rapid, custom UI development with a professional aesthetic.", icon: TailwindIcon },
    { name: "Recharts", description: "For rendering charts and visualizing historical signal performance.", icon: <i className="fas fa-chart-line text-orange-400 text-2xl"></i>},
];

export const backendTech: TechStackItem[] = [
    { name: "Node.js & Express", description: "A fast and efficient runtime for handling API requests and business logic.", icon: NodeIcon },
    { name: "WebSocket", description: "Enables real-time, bidirectional communication between server and client for instant signal delivery.", icon: WebSocketIcon },
    { name: "PostgreSQL/Redis", description: "PostgreSQL for storing historical signals and Redis for caching and session management.", icon: DatabaseIcon },
];

export const exampleSignal1: Signal = {
  time: "10:18 AM",
  symbol: "BANKNIFTY",
  price: 54000,
  direction: SignalDirection.BUY,
  rulesPassed: ["PrevDayLevels", "SupportResistance", "InitialBalanceBreakout"],
  rulesFailed: ["Momentum", "OIData"],
  conviction: 72,
};

export const exampleSignal2: Signal = {
  time: "02:45 PM",
  symbol: "BANKNIFTY",
  price: 53850,
  direction: SignalDirection.SELL,
  rulesPassed: ["Market Structure", "Component Divergence", "Volume Analysis"],
  rulesFailed: ["Candlestick Patterns"],
  conviction: 85,
};