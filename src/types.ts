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
  rulesFailed: string[];
  conviction: number;
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
}

export interface BacktestTrade {
    entryPrice: number;
    exitPrice: number;
    entryIndex: number;
    exitIndex: number;
    type: 'BUY' | 'SELL';
}

export interface BacktestResults {
    period: string;
    winRate: string;
    profitFactor: string;
    totalTrades: string;
    maxDrawdown: string;
    candles?: BacktestCandle[];
    trades?: BacktestTrade[];
}
