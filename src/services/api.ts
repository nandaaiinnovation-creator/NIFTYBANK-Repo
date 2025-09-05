import type { Signal, BacktestResults, SignalPerformance, AISuggestion, MarketVitals, NewsStatus, NewsEvent } from '../types';
// FIX: The import for `CustomizableRule` was removed because the source file is not a module.
// A local definition is provided to resolve the type error.
export interface CustomizableRule {
  title: string;
  enabled: boolean;
}

const API_BASE_URL = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8080';

let webSocket: WebSocket | null = null;

interface MarketTick {
    price: number;
    time: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
type MarketStatusValue = 'OPEN' | 'CLOSED';

interface BrokerStatus {
    status: ConnectionStatus;
    message: string;
}

interface MarketStatus {
    status: MarketStatusValue;
}

interface MarketSentiment {
    score: number;
}

interface WebSocketCallbacks {
    onSignal: (signal: Signal) => void;
    onTick: (tick: MarketTick) => void;
    onBrokerStatus: (status: BrokerStatus) => void;
    onMarketStatus: (status: MarketStatus) => void;
    onSentiment: (sentiment: MarketSentiment) => void;
    onVitals: (vitals: MarketVitals) => void;
    onNewsStatus: (status: NewsStatus) => void;
}

export const startLiveSignalStream = (callbacks: WebSocketCallbacks) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket connection already open.');
        return;
    }

    webSocket = new WebSocket(WS_URL);

    webSocket.onopen = () => {
        console.log('WebSocket connection established.');
    };

    webSocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            switch(message.type) {
                case 'new_signal':
                    callbacks.onSignal(message.payload);
                    break;
                case 'market_tick':
                    callbacks.onTick(message.payload);
                    break;
                case 'broker_status_update':
                    callbacks.onBrokerStatus(message.payload);
                    break;
                case 'market_status_update':
                    callbacks.onMarketStatus(message.payload);
                    break;
                case 'market_sentiment_update':
                    callbacks.onSentiment(message.payload);
                    break;
                case 'market_vitals_update':
                    callbacks.onVitals(message.payload);
                    break;
                case 'news_status_update':
                    callbacks.onNewsStatus(message.payload);
                    break;
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    webSocket.onclose = () => {
        console.log('WebSocket connection closed.');
        webSocket = null;
    };

    webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        webSocket = null;
    };
};

export const stopLiveSignalStream = () => {
    if (webSocket) {
        webSocket.close();
        webSocket = null;
    }
};

export const runBacktest = async (config: { 
    period: string; 
    timeframe: string; 
    from: number; 
    to: number; 
    sl?: number; 
    tp?: number;
    instrument?: string;
    tradeExitStrategy: 'stop' | 'signal';
    // New advanced params
    mode?: 'simple' | 'walk-forward';
    stopLossType?: 'percent' | 'atr';
    atrMultiplier?: number;
    walkForwardTrain?: number;
    walkForwardTest?: number;
}): Promise<BacktestResults> => {
    console.log('Running backtest with config:', config);
    const response = await fetch(`${API_BASE_URL}/backtest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Backtest API call failed');
    }

    return data;
};

export const saveRuleConfiguration = async (rules: CustomizableRule[]): Promise<{ status: string }> => {
    console.log('Saving rule configuration:', rules);
    const response = await fetch(`${API_BASE_URL}/rules`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(rules),
    });
    
    if (!response.ok) {
        throw new Error('Failed to save configuration');
    }

    return response.json();
};

export const connectToBroker = async (apiKey: string, accessToken: string): Promise<{ status: string; message: string }> => {
    console.log('Attempting to connect to broker...');
    const response = await fetch(`${API_BASE_URL}/broker/connect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Broker connection failed.');
    }

    return data;
};

export const runSignalAnalysis = async (config?: { sl: number, tp: number }): Promise<SignalPerformance> => {
    console.log('Requesting signal performance analysis with config:', config);
    const response = await fetch(`${API_BASE_URL}/ml/analyze-signals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Signal analysis failed');
    }

    return data;
};

export const getAIStrategySuggestions = async (results: BacktestResults, apiKey: string): Promise<AISuggestion> => {
    console.log('Requesting AI strategy suggestions...');
    const response = await fetch(`${API_BASE_URL}/ml/suggest-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, apiKey }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to get AI suggestions.');
    }
    return data;
};

export const initializeNewsEngine = async (apiKey: string): Promise<{ status: string; message: string }> => {
    console.log('Initializing News Engine...');
    const response = await fetch(`${API_BASE_URL}/news/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize News Engine.');
    }
    return data;
};
