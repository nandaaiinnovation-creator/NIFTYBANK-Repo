import type { Signal, BacktestResults } from '../types';
import type { CustomizableRule } from '../components/RuleCustomizer';

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

interface WebSocketCallbacks {
    onSignal: (signal: Signal) => void;
    onTick: (tick: MarketTick) => void;
    onBrokerStatus: (status: BrokerStatus) => void;
    onMarketStatus: (status: MarketStatus) => void;
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
            if (message.type === 'new_signal' && message.payload) {
                callbacks.onSignal(message.payload);
            } else if (message.type === 'market_tick' && message.payload) {
                callbacks.onTick(message.payload);
            } else if (message.type === 'broker_status_update' && message.payload) {
                callbacks.onBrokerStatus(message.payload);
            } else if (message.type === 'market_status_update' && message.payload) {
                callbacks.onMarketStatus(message.payload);
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

export const runBacktest = async (config: { period: string; timeframe: string }): Promise<BacktestResults> => {
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