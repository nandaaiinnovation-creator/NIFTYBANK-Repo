import React, { useState, useEffect, useCallback } from 'react';
import type { Signal } from '../types';
import { SignalDirection } from '../types';
import SignalCard from './SignalCard';
// FIX: Corrected import names for WebSocket connection functions to match exports from api.ts.
import { startLiveSignalStream, stopLiveSignalStream } from '../services/api';
import { useBroker } from '../contexts/BrokerContext';

interface ChartSignal extends Signal {
    id: string;
    x: number;
    y: number;
}

interface Candle {
    id: number;
    open: number;
    high: number;
    low: number;
    close: number;
    minute: number;
}

interface MarketTick {
    price: number;
    time: string;
}

const timeIntervals = [
  { label: '1 Min', value: 1 },
  { label: '3 Min', value: 3 },
  { label: '5 Min', value: 5 },
];

const MAX_CANDLES = 40; // Number of candles to display on the chart

const LiveSignals: React.FC = () => {
  const { status: brokerStatus, setApiKey, setAccessToken } = useBroker();
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [selectedInterval, setSelectedInterval] = useState<number>(1);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [chartSignals, setChartSignals] = useState<ChartSignal[]>([]);
  const [candlesticks, setCandlesticks] = useState<Candle[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });

  const generateInitialCandles = useCallback(() => {
    let price = 54000;
    const initialCandles: Candle[] = [];
    const now = new Date();
    for (let i = 0; i < MAX_CANDLES; i++) {
        const open = price;
        const change = (Math.random() - 0.5) * 50;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 15;
        const low = Math.min(open, close) - Math.random() * 15;
        const minute = (now.getMinutes() - (MAX_CANDLES - i)) % 60;
        initialCandles.push({ id: Date.now() - i, open, high, low, close, minute });
        price = close;
    }
    setCandlesticks(initialCandles);
  }, []);
  
  useEffect(() => {
    generateInitialCandles();
  }, [generateInitialCandles]);

  useEffect(() => {
    if (candlesticks.length === 0) return;
    const lows = candlesticks.map(c => c.low);
    const highs = candlesticks.map(c => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.1;
    setPriceRange({ min: min - padding, max: max + padding });
  }, [candlesticks]);


  const handleNewSignal = useCallback((newSignal: Signal) => {
    setSignals(prevSignals => [newSignal, ...prevSignals.slice(0, 19)]);
    
    if (priceRange.max > priceRange.min) {
        const range = priceRange.max - priceRange.min;
        const y = ((newSignal.price - priceRange.min) / range) * 100;
        
        const chartSignal: ChartSignal = {
            ...newSignal,
            id: `${newSignal.time}-${newSignal.price}`,
            x: 98,
            y: Math.max(5, Math.min(95, y)),
        }
        setChartSignals(prevChartSignals => [...prevChartSignals.slice(-9), chartSignal]);
    }
  }, [priceRange]);

  const handleNewTick = useCallback((tick: MarketTick) => {
    setCandlesticks(prevCandles => {
      if (prevCandles.length === 0) return [];
      
      const lastCandle = { ...prevCandles[prevCandles.length - 1] };
      const tickMinute = new Date(tick.time).getMinutes();

      // If the tick belongs to a new minute, create a new candle
      if (lastCandle.minute !== tickMinute) {
        const newCandle: Candle = {
          id: Date.now(),
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          minute: tickMinute,
        };
        // Remove the oldest candle and add the new one
        return [...prevCandles.slice(1), newCandle];
      }
      
      // Otherwise, update the last candle
      lastCandle.close = tick.price;
      lastCandle.high = Math.max(lastCandle.high, tick.price);
      lastCandle.low = Math.min(lastCandle.low, tick.price);
      
      const newCandles = [...prevCandles];
      newCandles[newCandles.length - 1] = lastCandle;
      return newCandles;
    });
  }, []);

  useEffect(() => {
    if (isReceiving) {
      // FIX: Corrected function name to match import.
      // FIX: Added missing onBrokerStatus and onMarketStatus callbacks to satisfy the WebSocketCallbacks type.
      startLiveSignalStream({
        onSignal: handleNewSignal,
        onTick: handleNewTick,
        onBrokerStatus: () => {
          // This component does not handle broker status updates directly, but the callback is required.
        },
        onMarketStatus: () => {
          // This component does not handle market status updates directly, but the callback is required.
        },
      });
    } else {
      // FIX: Corrected function name to match import.
      stopLiveSignalStream();
    }
    // FIX: Corrected function name to match import.
    return () => stopLiveSignalStream();
  }, [isReceiving, handleNewSignal, handleNewTick]);
  
  const toggleReceiver = () => {
    if (brokerStatus !== 'connected') {
        alert("Please connect to the broker first in the 'Broker Integration' section.");
        return;
    }
    if (!isReceiving) {
      setSignals([]);
      setChartSignals([]);
    }
    setIsReceiving(!isReceiving);
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
            <i className="fa-solid fa-tower-broadcast text-xl text-cyan-400 mr-3"></i>
            <h2 className="text-xl font-semibold text-white">Live Signal Dashboard</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-gray-900 rounded-md p-1">
                <span className="text-sm text-gray-400 px-2 hidden sm:block">Interval:</span>
                {timeIntervals.map(interval => (
                    <button
                        key={interval.value}
                        onClick={() => setSelectedInterval(interval.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            selectedInterval === interval.value
                                ? 'bg-cyan-500 text-white shadow'
                                : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {interval.label}
                    </button>
                ))}
            </div>

            <button
                onClick={toggleReceiver}
                className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 ${
                    isReceiving
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
                {isReceiving ? (
                    <><i className="fas fa-stop-circle animate-pulse"></i> Stop Feed</>
                ) : (
                    <><i className="fas fa-play-circle"></i> Start Feed</>
                )}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Chart View */}
          <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
            <h3 className="text-md font-semibold text-white mb-2">BANKNIFTY Chart ({selectedInterval} Min)</h3>
            <p className="text-xs text-gray-500 mb-4">Live chart powered by backend WebSocket tick data.</p>
            <div className="relative flex-grow bg-gray-800 rounded-md p-2 overflow-hidden">
                <div className="absolute top-0 right-2 h-full flex flex-col justify-between py-1 text-xs text-gray-500 z-10">
                    <span>{priceRange.max.toFixed(0)}</span>
                    <span>{(priceRange.min + (priceRange.max - priceRange.min) / 2).toFixed(0)}</span>
                    <span>{priceRange.min.toFixed(0)}</span>
                </div>

                {candlesticks.map((candle, index) => {
                    const range = priceRange.max - priceRange.min;
                    if (range <= 0) return null;

                    const isGreen = candle.close >= candle.open;
                    const bodyTop = Math.max(candle.open, candle.close);
                    const bodyBottom = Math.min(candle.open, candle.close);

                    const bodyHeight = Math.max(1, ((bodyTop - bodyBottom) / range) * 100);
                    const bodyBottomPos = ((bodyBottom - priceRange.min) / range) * 100;
                    const wickHeight = ((candle.high - candle.low) / range) * 100;
                    const wickBottomPos = ((candle.low - priceRange.min) / range) * 100;
                    
                    return (
                        <div key={candle.id} className="absolute h-full" style={{ left: `${(index / MAX_CANDLES) * 100}%`, width: `${100 / MAX_CANDLES}%` }}>
                            <div className="absolute bg-gray-500 mx-auto left-0 right-0" style={{ bottom: `${wickBottomPos}%`, height: `${Math.max(0, wickHeight)}%`, width: '2px' }}></div>
                            <div className={`absolute mx-auto left-0 right-0 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`} style={{ bottom: `${bodyBottomPos}%`, height: `${Math.max(0, bodyHeight)}%`, width: '60%' }}></div>
                        </div>
                    );
                })}

                {chartSignals.map((signal) => (
                    <div key={signal.id} className="absolute transition-all duration-500 ease-out animate-fade-in" style={{ left: `${signal.x}%`, bottom: `${signal.y}%`, transform: 'translateX(-50%)' }}>
                        <div className={`flex items-center gap-1 ${signal.direction === SignalDirection.BUY ? 'flex-col' : 'flex-col-reverse'}`}>
                            <div className={`p-1.5 rounded-md text-white text-xs font-bold shadow-lg ${signal.direction === SignalDirection.BUY ? 'bg-green-600' : 'bg-red-600'}`}>{signal.price}</div>
                            <i className={`fa-solid ${signal.direction === SignalDirection.BUY ? 'fa-caret-up text-green-400' : 'fa-caret-down text-red-400'} text-2xl`}></i>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-1 h-full overflow-y-auto pr-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-md font-semibold text-white mb-4">Recent Signals</h3>
            {signals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <i className="fas fa-satellite-dish text-5xl mb-4"></i>
                <p className="text-lg">Waiting for signals...</p>
                <p className="text-sm mt-2">
                    {isReceiving ? 'Receiving live data...' : 'Press "Start Feed" to begin.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {signals.map((signal, index) => (
                  <SignalCard key={`${signal.time}-${index}`} signal={signal} />
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default LiveSignals;