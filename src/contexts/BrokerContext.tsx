import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { connectToBroker as apiConnectToBroker } from '../services/api';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface BrokerContextType {
    status: ConnectionStatus;
    message: string;
    apiKey: string;
    accessToken: string;
    setApiKey: (key: string) => void;
    setAccessToken: (token: string) => void;
    connect: () => Promise<void>;
    disconnect: () => void;
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined);

export const BrokerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [message, setMessage] = useState('Enter your credentials to connect to the live data feed.');

    const connect = useCallback(async () => {
        if (!apiKey.trim() || !accessToken.trim()) {
            setStatus('error');
            setMessage('API Key and Access Token cannot be empty.');
            return;
        }

        setStatus('connecting');
        setMessage('Attempting to connect to Zerodha...');
        try {
            const response = await apiConnectToBroker(apiKey, accessToken);
            setStatus('connected');
            setMessage(response.message);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Connection failed. Please check credentials and try again.');
            // Re-throw to allow component to know about the failure
            throw error;
        }
    }, [apiKey, accessToken]);

    const disconnect = useCallback(() => {
        setApiKey('');
        setAccessToken('');
        setStatus('disconnected');
        setMessage('Enter your credentials to connect to the live data feed.');
    }, []);

    const value = {
        status,
        message,
        apiKey,
        accessToken,
        setApiKey,
        setAccessToken,
        connect,
        disconnect
    };

    return (
        <BrokerContext.Provider value={value}>
            {children}
        </BrokerContext.Provider>
    );
};

export const useBroker = (): BrokerContextType => {
    const context = useContext(BrokerContext);
    if (context === undefined) {
        throw new Error('useBroker must be used within a BrokerProvider');
    }
    return context;
};
