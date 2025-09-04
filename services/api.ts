import { SignalDirection } from '../types';
import type { Signal, BacktestResults } from '../types';
// FIX: The import for `CustomizableRule` was removed because the source file is not a module.
// A local definition is provided to resolve the type error.
export interface CustomizableRule {
  title: string;
  enabled: boolean;
}

const API_BASE_URL = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8080';

// --- LIVE WEB SOCKET CONNECTION ---

let webSocket: WebSocket | null = null;

/**
 * Connects to the backend WebSocket server to receive live signals.
 * @param onSignal A callback function to be called with each new signal.
 */
export const startLiveSignalStream = (onSignal: (signal: Signal) => void) => {
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
                onSignal(message.payload);
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

// --- LIVE REST API CALLS ---

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