import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { connectToBroker as apiConnectToBroker, startLiveSignalStream, stopLiveSignalStream } from '../services/api';
import type { Signal } from '../types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
type MarketStatus = 'OPEN' | 'CLOSED';

interface MarketTick {
    price: number;
    time: string;
}

interface BrokerContextType {
    status: ConnectionStatus;
    message: string;
    marketStatus: MarketStatus;
    apiKey: string;
    accessToken: string;
    lastTick: MarketTick | null;
    signals3m: Signal[];
    signals5m: Signal[];
    signals15m: Signal[];
    isStreaming: boolean;
    isModalOpen: boolean;
    setApiKey: (key: string) => void;
    setAccessToken: (token: string) => void;
    connect: () => Promise<void>;
    disconnect: () => void;
    startStream: () => void;
    stopStream: () => void;
    openModal: () => void;
    closeModal: () => void;
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined);

export const BrokerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [message, setMessage] = useState('Enter credentials to connect.');
    const [marketStatus, setMarketStatus] = useState<MarketStatus>('CLOSED');
    const [lastTick, setLastTick] = useState<MarketTick | null>(null);
    const [signals3m, setSignals3m] = useState<Signal[]>([]);
    const [signals5m, setSignals5m] = useState<Signal[]>([]);
    const [signals15m, setSignals15m] = useState<Signal[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const connect = useCallback(async () => {
        if (!apiKey.trim() || !accessToken.trim()) {
            setStatus('error');
            setMessage('API Key & Access Token are required.');
            return;
        }

        setStatus('connecting');
        setMessage('Connecting to broker...');
        try {
            // The API call initiates the connection, but the final status ('connected' or 'error')
            // will be confirmed via a WebSocket message from the backend.
            await apiConnectToBroker(apiKey, accessToken);
            // We no longer set 'connected' here; we wait for the backend's confirmation.
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Connection failed.');
            throw error;
        }
    }, [apiKey, accessToken]);

    const disconnect = useCallback(() => {
        stopStream();
        setApiKey('');
        setAccessToken('');
        setStatus('disconnected');
        setMessage('Enter credentials to connect.');
    }, []);

    const startStream = useCallback(() => {
        if (status === 'connected') {
            setSignals3m([]);
            setSignals5m([]);
            setSignals15m([]);
            setIsStreaming(true);
        } else {
            console.warn("Cannot start stream: broker not connected.");
            alert("Please connect to the broker first.");
        }
    }, [status]);

    const stopStream = useCallback(() => {
        setIsStreaming(false);
    }, []);

    useEffect(() => {
        // The WebSocket stream is now started immediately on connection to get status updates,
        // but signal/tick processing is controlled by the `isStreaming` flag.
        if (status === 'connected' || status === 'reconnecting' || (status === 'connecting' && isStreaming)) {
            const handleSignal = (newSignal: Signal) => {
                 if (!isStreaming) return;
                 switch (newSignal.timeframe) {
                    case '3m':
                        setSignals3m(prev => [newSignal, ...prev.slice(0, 99)]);
                        break;
                    case '5m':
                        setSignals5m(prev => [newSignal, ...prev.slice(0, 99)]);
                        break;
                    case '15m':
                        setSignals15m(prev => [newSignal, ...prev.slice(0, 99)]);
                        break;
                    default:
                        break;
                }
            };
            const handleTick = (newTick: MarketTick) => {
                if (!isStreaming) return;
                setLastTick(newTick);
            };
            
            const handleBrokerStatus = (brokerStatus: { status: ConnectionStatus, message: string }) => {
                setStatus(brokerStatus.status);
                setMessage(brokerStatus.message);
                if (brokerStatus.status === 'connected' && !isModalOpen) {
                    closeModal();
                }
            };

            const handleMarketStatus = (marketStatus: { status: MarketStatus }) => {
                setMarketStatus(marketStatus.status);
            };

            startLiveSignalStream({ 
                onSignal: handleSignal, 
                onTick: handleTick,
                onBrokerStatus: handleBrokerStatus,
                onMarketStatus: handleMarketStatus,
            });
        } else {
            stopLiveSignalStream();
        }

        return () => stopLiveSignalStream();
    }, [status, isStreaming, isModalOpen]);


    const value = {
        status,
        message,
        marketStatus,
        apiKey,
        accessToken,
        lastTick,
        signals3m,
        signals5m,
        signals15m,
        isStreaming,
        isModalOpen,
        setApiKey,
        setAccessToken,
        connect,
        disconnect,
        startStream,
        stopStream,
        openModal,
        closeModal,
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