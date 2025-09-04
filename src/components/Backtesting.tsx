import React, { useState, useMemo } from 'react';
import { runBacktest } from '../services/api';
import type { BacktestResults, BacktestCandle, BacktestSignal } from '../types';
import { SignalDirection } from '../types';
import { useBroker } from '../contexts/BrokerContext';

const getSignalStrengthText = (conviction: number): string => {
    if (conviction > 85) return 'Strong';
    if (conviction > 65) return 'Medium';
    return 'Low';
};


const BacktestChart: React.FC<{ candles: BacktestCandle[], signals: BacktestSignal[] }> = ({ candles = [], signals = [] }) => {
    const priceRange = useMemo(() => {
        if (candles.length === 0) return { min: 0, max: 0 };
        const lows = candles.map(c => c.low);
        const highs = candles.map(c => c.high);
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        const padding = (max - min) * 0.1;
        return { min: min - padding, max: max + padding };
    }, [candles]);
    
    const maxCandles = candles.length;
    const range = priceRange.max - priceRange.min;
    
    if (range <= 0) return <div className="h-96 bg-zinc-800 flex items-center justify-center text-gray-500">Not enough data to display chart.</div>;

    const getYPosition = (price: number) => ((price - priceRange.min) / range) * 100;

    return (
        <div className="bg-zinc-900 h-96 p-4 relative overflow-hidden border border-zinc-700">
            {/* Y-Axis */}
            <div className="absolute top-0 right-2 h-full flex flex-col justify-between py-1 text-xs text-gray-500 z-10">
                <span>{priceRange.max.toFixed(0)}</span>
                <span>{priceRange.min.toFixed(0)}</span>
            </div>

            {/* Candlesticks */}
            {candles.map((candle, index) => {
                const isGreen = candle.close >= candle.open;
                const bodyTop = Math.max(candle.open, candle.close);
                const bodyBottom = Math.min(candle.open, candle.close);

                const bodyHeight = Math.max(1, ((bodyTop - bodyBottom) / range) * 100);
                const bodyBottomPos = getYPosition(bodyBottom);
                const wickHeight = ((candle.high - candle.low) / range) * 100;
                const wickBottomPos = getYPosition(candle.low);
                
                return (
                    <div key={candle.id} className="absolute h-full" style={{ left: `${(index / maxCandles) * 100}%`, width: `${100 / maxCandles}%` }}>
                        <div className="absolute bg-gray-500 mx-auto left-0 right-0" style={{ bottom: `${wickBottomPos}%`, height: `${Math.max(0, wickHeight)}%`, width: '1.5px' }}></div>
                        <div className={`absolute mx-auto left-0 right-0 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`} style={{ bottom: `${bodyBottomPos}%`, height: `${Math.max(0, bodyHeight)}%`, width: '70%' }}></div>
                    </div>
                );
            })}
            
            {/* Signals */}
            {signals.map((signal) => {
                 const x = (signal.candleIndex / maxCandles) * 100 + (0.5 / maxCandles) * 100;
                 const y = getYPosition(signal.price);
                 const isBuy = signal.direction === SignalDirection.BUY;
                 return (
                     <div key={`${signal.candleIndex}-${signal.time}`} className="absolute" style={{ left: `${x}%`, bottom: `${y}%`, transform: 'translate(-50%, 0)' }}>
                         <i className={`fa-solid ${isBuy ? 'fa-arrow-alt-circle-up text-green-400' : 'fa-arrow-alt-circle-down text-red-400'} bg-zinc-900 rounded-full text-lg`}></i>
                     </div>
                 )
            })}
        </div>
    );
};

const Backtesting: React.FC = () => {
    const { status: brokerStatus } = useBroker();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState({ period: '1 month', timeframe: '3m' });

    const handleRunBacktest = async () => {
        if (brokerStatus !== 'connected') {
            setError('Please connect to the broker on the Live Dashboard page before running a backtest.');
            return;
        }
        setIsLoading(true);
        setResults(null);
        setError(null);
        
        try {
            const apiResults = await runBacktest(config);
            setResults(apiResults);
        } catch (err: any) {
            console.error("Backtest failed:", err);
            setError(err.message || "An unknown error occurred during the backtest.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const timeframes = ['1m', '3m', '5m', '15m'];
    const periods = ['1 month', '2 months', '3 months', '6 months', '1 year', '2 years', '3 years', '5 years'];

    return (
        <div className="bg-zinc-800 p-2 border border-zinc-700">
            <div className="flex items-center mb-3">
                <i className="fa-solid fa-backward-fast text-lg text-cyan-400 mr-3"></i>
                <h2 className="text-lg font-semibold text-white">Backtesting Engine</h2>
            </div>
            <p className="text-sm text-gray-400 mb-3">
                Validate the effectiveness of the trading logic by running simulations on real historical data.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-zinc-900/50 p-3 border border-zinc-700">
                    <h3 className="font-semibold text-white mb-3 text-sm">Configuration</h3>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="date-range" className="block text-xs font-medium text-gray-400 mb-1">Historical Data Range</label>
                            <select 
                                id="date-range" 
                                className="w-full bg-zinc-700 border border-zinc-600 py-1.5 px-3 text-white text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                value={config.period}
                                onChange={(e) => setConfig(prev => ({ ...prev, period: e.target.value }))}
                            >
                                {periods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Candlestick Timeframe</label>
                            <div className="flex items-center gap-2">
                                {timeframes.map(tf => (
                                     <button 
                                        key={tf} 
                                        onClick={() => setConfig(prev => ({ ...prev, timeframe: tf }))}
                                        className={`px-2 py-1 text-xs ${config.timeframe === tf ? 'bg-cyan-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'}`}
                                      >
                                        {tf}
                                     </button>
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-4 text-xs text-gray-500 bg-zinc-800 p-2 border border-zinc-700">
                        <i className="fa-solid fa-circle-info mr-2 text-cyan-400"></i>
                        <strong>How it works:</strong> The engine fetches data from the broker and caches it locally. Subsequent tests on the same period are faster and will automatically fill in any missing data.
                    </div>
                    <button onClick={handleRunBacktest} disabled={isLoading} className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 text-sm transition-colors flex items-center justify-center gap-2">
                         {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Running...</> : <><i className="fas fa-play"></i> Run Backtest</>}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 bg-zinc-900/50 p-3 border border-zinc-700 min-h-[400px]">
                    <h3 className="font-semibold text-white mb-3 text-sm">Backtest Results</h3>
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <i className="fas fa-chart-line text-4xl mb-3 animate-pulse"></i>
                            <p className="text-md">Fetching & Analyzing Historical Data...</p>
                            <p className="text-xs mt-1">This may take a moment, especially for long date ranges.</p>
                         </div>
                    )}
                    {!isLoading && !results && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                           <i className="fas fa-vial-circle-check text-4xl mb-3"></i>
                           <p className="text-md">Ready to run analysis</p>
                           <p className="text-xs">{error ? <span className="text-red-400">{error}</span> : 'Configure parameters and click "Run Backtest".'}</p>
                        </div>
                    )}
                    {results && (
                        <div className="space-y-3">
                             <div className="flex justify-between items-center bg-zinc-800 p-2 border border-zinc-700">
                                <div className="text-xs text-gray-400">
                                    Showing results for <span className="font-semibold text-white">{results.period}</span> on a <span className="font-semibold text-white">{results.timeframe}</span> timeframe.
                                </div>
                                <div className="text-xs text-gray-400">
                                    Signals Generated: <span className="font-bold text-lg text-cyan-400">{results.signals.length}</span>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                <div className="h-[400px] xl:h-auto">
                                    <h4 className="font-semibold text-white text-center text-sm mb-2">Signal Visualization</h4>
                                    <BacktestChart candles={results.candles} signals={results.signals} />
                                </div>
                                <div className="h-[400px] xl:h-auto flex flex-col">
                                     <h4 className="font-semibold text-white text-center text-sm mb-2">Generated Signals Log</h4>
                                     <div className="flex-grow overflow-y-auto bg-zinc-900 border border-zinc-700 p-2 space-y-2">
                                        {results.signals.length === 0 ? (
                                            <div className="text-center text-gray-500 text-sm p-4">No signals were generated with the current configuration.</div>
                                        ) : (
                                            [...results.signals].reverse().map((signal, index) => (
                                                <div key={index} className="bg-zinc-800 p-2 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-white">{new Date(signal.time).toLocaleString()}</span>
                                                        <span className={`font-bold ${signal.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{signal.direction} @ {signal.price}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1 text-gray-400">
                                                         <span>Conviction: <span className="font-semibold text-white">{signal.conviction}%</span></span>
                                                         <span>Strength: <span className="font-semibold text-white">{getSignalStrengthText(signal.conviction)}</span></span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                     </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Backtesting;