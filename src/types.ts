export enum SignalDirection {
  BUY = 'BUY',
  SELL = 'SELL',
  NEUTRAL = 'NEUTRAL',
}

export interface Signal {
  time: string;
  symbol: string;
  price: number;
  direction: SignalDirection;
  rulesPassed: string[];
  rulesFailed:string[];
  conviction: number;
  timeframe: string;
}

export interface TradingRule {
  title: string;
  description: string;
}

export interface TechStackItem {
  name: string;
  description: string;
  icon: JSX.Element;
}

export interface Section {
  id: string;
  title: string;
  iconClass: string;
}

export interface BacktestCandle {
    id: number;
    open: number;
    high: number;
    low: number;
    close: number;
    date: string; // ISO string from server
}

export interface BacktestSignal extends Signal {
    candleIndex: number;
}

export interface EquityPoint {
    tradeNumber: number;
    equity: number;
    date: string;
}

export interface RulePerformance {
    rule: string;
    wins: number;
    losses: number;
    winRate: string;
    total: number;
}

export interface BacktestResults {
    period: string;
    instrument: string;
    timeframe: string;
    tradeExitStrategy: 'stop' | 'signal';
    candles?: BacktestCandle[];
    signals: BacktestSignal[];
    dataSourceMessage?: string;
    // Metrics
    winRate: string;
    profitFactor: string;
    totalTrades: number;
    maxDrawdown: string;
    netProfit: number;
    totalWins: number;
    totalLosses: number;
    avgWin: number;
    avgLoss: number;
    equityCurve: EquityPoint[];
    rulePerformance: RulePerformance[];
}

export interface SignalPerformance {
    totalSignals: number;
    wins: number;
    losses: number;
    winRate: string;
    rulePerformance: RulePerformance[];
}

export interface AISuggestion {
    suggestions: string;
}

export interface MarketVitals {
  open: number;
  high: number;
  low: number;
  vix: number;
}
