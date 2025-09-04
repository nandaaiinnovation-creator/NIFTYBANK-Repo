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

export interface BacktestResults {
    period: string;
    timeframe: string;
    candles: BacktestCandle[];
    signals: BacktestSignal[];
    dataSourceMessage?: string;
    winRate: string;
    profitFactor: string;
    totalTrades: number;
    maxDrawdown: string;
}

export interface RulePerformance {
    rule: string;
    wins: number;
    losses: number;
    winRate: string;
}

export interface SignalPerformance {
    totalSignals: number;
    wins: number;
    losses: number;
    winRate: string;
    rulePerformance: RulePerformance[];
}