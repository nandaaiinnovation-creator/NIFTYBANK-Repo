import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
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
    sentiment: number;
    isChartLive: boolean;
    isSignalFeedActive: boolean;
    isModalOpen: boolean;
    setApiKey: (key: string) => void;
    setAccessToken: (token: string) => void;
    connect: () => Promise<void>;
    disconnect: () => void;
    toggleChartLive: () => void;
    toggleSignalFeedActive: () => void;
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
    const [sentiment, setSentiment] = useState(50); // Default to Neutral (50)
    
    // Granular streaming controls
    const [isChartLive, setIsChartLive] = useState(false);
    const [isSignalFeedActive, setIsSignalFeedActive] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // For signal batching to prevent UI lag
    const signalQueueRef = useRef<Signal[]>([]);
    const batchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const processSignalQueue = useCallback(() => {
        if (signalQueueRef.current.length === 0) return;

        const signalsToProcess = [...signalQueueRef.current];
        signalQueueRef.current = [];

        setSignals3m(prev => [...signalsToProcess.filter(s => s.timeframe === '3m'), ...prev.slice(0, 99)]);
        setSignals5m(prev => [...signalsToProcess.filter(s => s.timeframe === '5m'), ...prev.slice(0, 99)]);
        setSignals15m(prev => [...signalsToProcess.filter(s => s.timeframe === '15m'), ...prev.slice(0, 99)]);
    }, []);

    const connect = useCallback(async () => {
        if (!apiKey.trim() || !accessToken.trim()) {
            setStatus('error');
            setMessage('API Key & Access Token are required.');
            return;
        }
        setStatus('connecting');
        setMessage('Connecting to broker...');
        try {
            await apiConnectToBroker(apiKey, accessToken);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Connection failed.');
            throw error;
        }
    }, [apiKey, accessToken]);

    const disconnect = useCallback(() => {
        setIsChartLive(false);
        setIsSignalFeedActive(false);
        setApiKey('');
        setAccessToken('');
        setStatus('disconnected');
        setMessage('Enter credentials to connect.');
    }, []);

    const toggleChartLive = useCallback(() => {
        if (status === 'connected') setIsChartLive(prev => !prev);
    }, [status]);
    
    const toggleSignalFeedActive = useCallback(() => {
        if (status === 'connected') {
             if (!isSignalFeedActive) { // When turning on
                setSignals3m([]);
                setSignals5m([]);
                setSignals15m([]);
            }
            setIsSignalFeedActive(prev => !prev);
        }
    }, [status, isSignalFeedActive]);

    useEffect(() => {
        if (status === 'connected' || status === 'reconnecting') {
             const handleSignal = (newSignal: Signal) => {
                 if (!isSignalFeedActive) return;
                 signalQueueRef.current.push(newSignal);
            };
            const handleTick = (newTick: MarketTick) => {
                if (!isChartLive) return;
                setLastTick(newTick);
            };
            
            const handleBrokerStatus = (brokerStatus: { status: ConnectionStatus, message: string }) => {
                setStatus(brokerStatus.status);
                setMessage(brokerStatus.message);
                if (brokerStatus.status === 'connected' && isModalOpen) {
                    closeModal();
                }
                 if (brokerStatus.status !== 'connected') {
                    setIsChartLive(false);
                    setIsSignalFeedActive(false);
                }
            };

            const handleMarketStatus = (marketStatus: { status: MarketStatus }) => {
                setMarketStatus(marketStatus.status);
            };
            
            const handleSentiment = (sentimentPayload: { score: number }) => {
                setSentiment(sentimentPayload.score);
            };

            startLiveSignalStream({ 
                onSignal: handleSignal, 
                onTick: handleTick,
                onBrokerStatus: handleBrokerStatus,
                onMarketStatus: handleMarketStatus,
                onSentiment: handleSentiment,
            });

            // Start batch processing timer
            if (!batchTimerRef.current) {
                batchTimerRef.current = setInterval(processSignalQueue, 500);
            }
        } else {
            stopLiveSignalStream();
            if (batchTimerRef.current) {
                clearInterval(batchTimerRef.current);
                batchTimerRef.current = null;
            }
        }

        return () => {
            stopLiveSignalStream();
            if (batchTimerRef.current) {
                clearInterval(batchTimerRef.current);
                batchTimerRef.current = null;
            }
        }
    }, [status, isSignalFeedActive, isChartLive, isModalOpen, processSignalQueue]);

    const value = {
        status, message, marketStatus, apiKey, accessToken, lastTick,
        signals3m, signals5m, signals15m,
        sentiment,
        isChartLive, isSignalFeedActive,
        isModalOpen,
        setApiKey, setAccessToken,
        connect, disconnect,
        toggleChartLive, toggleSignalFeedActive,
        openModal, closeModal,
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