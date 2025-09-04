import React, { useState } from 'react';
import { runBacktest } from '../services/api';
import type { BacktestResults } from '../types';
import { useBroker } from '../contexts/BrokerContext';
import TradingViewChart from './TradingViewChart';

const getSignalStrengthText = (conviction: number): string => {
    if (conviction > 85) return 'Strong';
    if (conviction > 65) return 'Medium';
    return 'Low';
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
            const apiResults = await runBacktest({ ...config, from: 0, to: 0});
            setResults(apiResults);
        } catch (err: any) {
            console.error("Backtest failed:", err);
            setError(err.message || "An unknown error occurred during the backtest.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const timeframes = ['1m', '3m', '5m', '15m'];
    const periods = ['1 month', '3 months', '6 months', '1 year', '3 years', '5 years'];

    return (
        <div className="bg-zinc-900 border border-zinc-700 h-full flex flex-col p-2 gap-2">
            <div className="flex items-center flex-shrink-0">
                <i className="fa-solid fa-backward-fast text-md text-cyan-400 mr-2"></i>
                <h2 className="text-md font-semibold text-white">Backtesting Engine</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-grow overflow-hidden">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-zinc-950 p-3 border border-zinc-800 flex flex-col">
                    <h3 className="font-semibold text-white mb-3 text-sm">Configuration</h3>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="date-range" className="block text-xs font-medium text-gray-400 mb-1">Historical Data Range</label>
                            <select 
                                id="date-range" 
                                className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm"
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
                                        className={`px-2 py-1 text-xs rounded-sm ${config.timeframe === tf ? 'bg-cyan-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'}`}
                                      >
                                        {tf}
                                     </button>
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="mt-4 text-xs text-zinc-500 bg-zinc-900 p-2 border border-zinc-800 rounded-sm">
                        <i className="fa-solid fa-circle-info mr-2 text-cyan-500"></i>
                        The engine fetches data from the broker and caches it locally. Subsequent tests on the same period are faster.
                    </div>
                    <button onClick={handleRunBacktest} disabled={isLoading} className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 text-sm rounded-sm transition-colors flex items-center justify-center gap-2">
                         {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Running...</> : <><i className="fas fa-play"></i> Run Backtest</>}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 bg-zinc-950 p-3 border border-zinc-800 min-h-[400px] flex flex-col">
                    <h3 className="font-semibold text-white mb-2 text-sm">Backtest Results</h3>
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <i className="fas fa-chart-line text-4xl mb-3 animate-pulse"></i>
                            <p className="text-md">Fetching & Analyzing Historical Data...</p>
                         </div>
                    )}
                    {!isLoading && !results && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-center">
                           <i className="fas fa-vial-circle-check text-4xl mb-3"></i>
                           <p className="text-md">Ready to run analysis</p>
                           <p className="text-xs mt-1">{error ? <span className="text-red-400">{error}</span> : 'Configure parameters and click "Run Backtest".'}</p>
                        </div>
                    )}
                    {results && (
                        <div className="flex-grow flex flex-col gap-2 overflow-hidden">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                                <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Win Rate</div><div className="text-lg font-bold text-green-400">{results.winRate}</div></div>
                                <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Profit Factor</div><div className="text-lg font-bold text-white">{results.profitFactor}</div></div>
                                <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Total Trades</div><div className="text-lg font-bold text-white">{results.totalTrades}</div></div>
                                <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Max Drawdown</div><div className="text-lg font-bold text-red-400">{results.maxDrawdown}</div></div>
                            </div>
                             
                             <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-2 overflow-hidden">
                                <div className="min-h-[250px] xl:h-auto flex flex-col">
                                    <h4 className="font-semibold text-white text-center text-xs mb-1">Signal Visualization</h4>
                                    <div className="h-full w-full bg-zinc-900 border border-zinc-800 flex-grow">
                                        <TradingViewChart 
                                            isLive={false}
                                            initialData={results.candles}
                                            signals={results.signals}
                                        />
                                    </div>
                                </div>
                                <div className="min-h-[250px] xl:h-auto flex flex-col">
                                     <h4 className="font-semibold text-white text-center text-xs mb-1">Generated Signals Log</h4>
                                     <div className="flex-grow overflow-y-auto bg-zinc-900 border border-zinc-800 p-1 space-y-1">
                                        {results.signals.length === 0 ? (
                                            <div className="text-center text-zinc-600 text-sm p-4">No signals generated.</div>
                                        ) : (
                                            [...results.signals].reverse().map((signal, index) => (
                                                <div key={index} className="bg-zinc-800 p-1.5 text-xs rounded-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-white text-[10px]">{new Date(signal.time).toLocaleString()}</span>
                                                        <span className={`font-bold text-xs ${signal.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{signal.direction} @ {signal.price}</span>
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