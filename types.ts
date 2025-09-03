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