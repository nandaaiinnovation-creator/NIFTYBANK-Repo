import React, { useState, useEffect, useCallback } from 'react';
import SignalCard from './SignalCard';
import type { Signal } from '../types';
import { SignalDirection } from '../types';
import { useBroker } from '../contexts/BrokerContext';

interface ChartSignal extends Signal { id: string; x: number; y: number; }
interface Candle { id: number; open: number; high: number; low: number; close: number; minute: number; }
const MAX_CANDLES = 60; // Increased candle count for 3-min chart

const Dashboard: React.FC = () => {
  const { status: brokerStatus, marketStatus, lastTick, signals3m, signals5m, signals15m, isStreaming, startStream, stopStream } = useBroker();
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

  useEffect(() => { generateInitialCandles(); }, [generateInitialCandles]);

  useEffect(() => {
    if (candlesticks.length === 0) return;
    const lows = candlesticks.map(c => c.low);
    const highs = candlesticks.map(c => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max-min) * 0.1;
    setPriceRange({ min: min - padding, max: max + padding });
  }, [candlesticks]);

  useEffect(() => {
    if (!lastTick) return;

    setCandlesticks(prevCandles => {
      if (prevCandles.length === 0) return [];
      const lastCandle = { ...prevCandles[prevCandles.length - 1] };
      const tickMinute = new Date(lastTick.time).getMinutes();

      if (lastCandle.minute !== tickMinute) {
        const newCandle: Candle = { id: Date.now(), open: lastTick.price, high: lastTick.price, low: lastTick.price, close: lastTick.price, minute: tickMinute };
        return [...prevCandles.slice(1), newCandle];
      }
      
      lastCandle.close = lastTick.price;
      lastCandle.high = Math.max(lastCandle.high, lastTick.price);
      lastCandle.low = Math.min(lastCandle.low, lastTick.price);
      
      const newCandles = [...prevCandles];
      newCandles[newCandles.length - 1] = lastCandle;
      return newCandles;
    });
  }, [lastTick]);

  const placeSignalOnChart = useCallback((latestSignal: Signal | undefined) => {
    if (!latestSignal) return;

    if (priceRange.max > priceRange.min) {
        const range = priceRange.max - priceRange.min;
        const y = ((latestSignal.price - priceRange.min) / range) * 100;
        const chartSignal: ChartSignal = { ...latestSignal, id: `${latestSignal.time}-${latestSignal.price}`, x: 98, y: Math.max(5, Math.min(95, y)), }
        setChartSignals(prev => [...prev.slice(-9), chartSignal]);
    }
  }, [priceRange]);

  useEffect(() => placeSignalOnChart(signals3m[0]), [signals3m, placeSignalOnChart]);
  useEffect(() => placeSignalOnChart(signals5m[0]), [signals5m, placeSignalOnChart]);
  useEffect(() => placeSignalOnChart(signals15m[0]), [signals15m, placeSignalOnChart]);
  
  const toggleStream = () => {
    if (isStreaming) stopStream();
    else startStream();
  }

  const EmptyState = ({ timeframe }: {timeframe: string}) => (
    <div className="flex items-center justify-center h-full text-center text-gray-500 text-xs px-2">
      {isStreaming ? (marketStatus === 'OPEN' ? `Waiting for ${timeframe} signals...` : 'Market is closed.') : 'Start feed to see signals.'}
    </div>
  );
  
  const EmptyLatestSignal = () => (
    <div className="flex items-center justify-center h-full text-center text-gray-500 text-xs p-2">
      Waiting for signal...
    </div>
  );

  return (
    <div className="bg-zinc-800 p-2 border border-zinc-700 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div className="flex items-center gap-4">
                 <div className="flex items-center">
                    <i className="fa-solid fa-desktop text-lg text-cyan-400 mr-3"></i>
                    <h2 className="text-lg font-semibold text-white">Live Dashboard</h2>
                </div>
                 <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white hidden md:block">Market Status:</h3>
                    <span className={`font-bold text-xs px-3 py-1 ${marketStatus === 'OPEN' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {marketStatus}
                    </span>
                </div>
            </div>
            <button
                onClick={toggleStream}
                disabled={brokerStatus !== 'connected'}
                className={`px-3 py-1.5 font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-xs ${isStreaming ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} disabled:bg-zinc-600 disabled:cursor-not-allowed`} >
                {isStreaming ? <><i className="fas fa-stop-circle animate-pulse"></i> Stop Feed</> : <><i className="fas fa-play-circle"></i> Start Feed</>}
            </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow grid grid-cols-1 xl:grid-cols-5 gap-2 overflow-hidden">
            {/* Chart */}
            <div className="xl:col-span-2 bg-zinc-900 p-2 border border-zinc-700 flex flex-col h-full min-h-[300px]">
                <h3 className="text-sm font-semibold text-white mb-1 flex-shrink-0">BANKNIFTY Chart (3 Min)</h3>
                <div className="relative flex-grow bg-zinc-800 overflow-hidden">
                    <div className="absolute top-0 right-2 h-full flex flex-col justify-between py-1 text-xs text-gray-500 z-10">
                        <span>{priceRange.max.toFixed(0)}</span>
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
                                <div className="absolute bg-gray-500 mx-auto left-0 right-0" style={{ bottom: `${wickBottomPos}%`, height: `${Math.max(0, wickHeight)}%`, width: '1.5px' }}></div>
                                <div className={`absolute mx-auto left-0 right-0 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`} style={{ bottom: `${bodyBottomPos}%`, height: `${Math.max(0, bodyHeight)}%`, width: '70%' }}></div>
                            </div>
                        );
                    })}
                    {chartSignals.map((signal) => (
                        <div key={signal.id} className="absolute transition-all duration-500 ease-out animate-fade-in" style={{ left: `${signal.x}%`, bottom: `${signal.y}%`, transform: 'translateX(-50%)' }}>
                            <div className={`flex items-center gap-1 ${signal.direction === SignalDirection.BUY ? 'flex-col' : 'flex-col-reverse'}`}>
                                <div className={`px-1 py-0.5 text-white text-[10px] font-bold shadow-lg ${signal.direction === SignalDirection.BUY ? 'bg-green-600' : 'bg-red-600'}`}>{signal.price}</div>
                                <i className={`fa-solid ${signal.direction === SignalDirection.BUY ? 'fa-caret-up text-green-400' : 'fa-caret-down text-red-400'} text-lg`}></i>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Signal Display Container */}
            <div className="xl:col-span-3 bg-zinc-900 p-2 border border-zinc-700 flex flex-col h-full min-h-[300px] overflow-hidden">
                {/* Latest Active Signals */}
                <div className="flex-shrink-0 mb-3">
                    <h3 className="text-sm font-semibold text-white mb-2">Latest Active Signals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="bg-zinc-800 border border-zinc-700">
                            <h4 className="text-center text-xs font-bold text-cyan-400 border-b border-zinc-700 p-1">3 MINUTE</h4>
                            <div className="p-1 min-h-[100px] flex flex-col justify-center">
                                {signals3m.length > 0 ? <SignalCard signal={signals3m[0]} /> : <EmptyLatestSignal />}
                            </div>
                        </div>
                        <div className="bg-zinc-800 border border-zinc-700">
                            <h4 className="text-center text-xs font-bold text-cyan-400 border-b border-zinc-700 p-1">5 MINUTE</h4>
                            <div className="p-1 min-h-[100px] flex flex-col justify-center">
                                {signals5m.length > 0 ? <SignalCard signal={signals5m[0]} /> : <EmptyLatestSignal />}
                            </div>
                        </div>
                        <div className="bg-zinc-800 border border-zinc-700">
                            <h4 className="text-center text-xs font-bold text-cyan-400 border-b border-zinc-700 p-1">15 MINUTE</h4>
                            <div className="p-1 min-h-[100px] flex flex-col justify-center">
                                {signals15m.length > 0 ? <SignalCard signal={signals15m[0]} /> : <EmptyLatestSignal />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signal Log */}
                <div className="flex-grow flex flex-col overflow-hidden">
                     <h3 className="text-sm font-semibold text-white mb-2 flex-shrink-0">Today's Signal Log</h3>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2 overflow-hidden">
                        <div className="overflow-y-auto pr-1 space-y-2 h-full">
                            {signals3m.length > 0 ? signals3m.map((s, i) => <div key={`${s.time}-3m-${i}`} className={i === 0 ? 'animate-fade-in' : ''}><SignalCard signal={s} /></div>) : <EmptyState timeframe="3m" />}
                        </div>
                        <div className="overflow-y-auto pr-1 space-y-2 h-full">
                             {signals5m.length > 0 ? signals5m.map((s, i) => <div key={`${s.time}-5m-${i}`} className={i === 0 ? 'animate-fade-in' : ''}><SignalCard signal={s} /></div>) : <EmptyState timeframe="5m" />}
                        </div>
                        <div className="overflow-y-auto pr-1 space-y-2 h-full">
                             {signals15m.length > 0 ? signals15m.map((s, i) => <div key={`${s.time}-15m-${i}`} className={i === 0 ? 'animate-fade-in' : ''}><SignalCard signal={s} /></div>) : <EmptyState timeframe="15m" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;