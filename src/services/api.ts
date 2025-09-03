import type { Signal, BacktestResults } from '../types';
import type { CustomizableRule } from '../components/RuleCustomizer';

const API_BASE_URL = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8080';

let webSocket: WebSocket | null = null;

interface MarketTick {
    price: number;
    time: string;
}

interface WebSocketCallbacks {
    onSignal: (signal: Signal) => void;
    onTick: (tick: MarketTick) => void;
}

/**
 * Connects to the backend WebSocket server to receive live data.
 * @param callbacks An object containing callbacks for different event types.
 */
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

/**
 * Disconnects from the WebSocket server.
 */
export const stopLiveSignalStream = () => {
    if (webSocket) {
        webSocket.close();
        webSocket = null;
    }
};

/**
 * Calls the backtesting API endpoint.
 * @param config The configuration for the backtest.
 * @returns A promise that resolves with the backtest results.
 */
export const runBacktest = async (config: { period: string }): Promise<BacktestResults> => {
    console.log('Running backtest with config:', config);
    const response = await fetch(`${API_BASE_URL}/backtest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        throw new Error('Backtest API call failed');
    }

    return response.json();
};

/**
 * Saves the rule configuration to the server.
 * @param rules The array of rule configurations to save.
 * @returns A promise that resolves when the save is complete.
 */
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

/**
 * Connects to the broker with API credentials.
 * @param apiKey The user's broker API key.
 * @param accessToken The daily-generated access token.
 * @returns A promise that resolves on successful connection or rejects on failure.
 */
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
