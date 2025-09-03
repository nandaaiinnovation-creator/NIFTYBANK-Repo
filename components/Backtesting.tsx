import React, { useState, useMemo } from 'react';
import SectionCard from './SectionCard';
import { runBacktest } from '../services/api';
import type { BacktestResults, BacktestCandle, BacktestTrade } from '../types';

const BacktestChart: React.FC<{ candles: BacktestCandle[], trades: BacktestTrade[] }> = ({ candles = [], trades = [] }) => {
    const priceRange = useMemo(() => {
        if (candles.length === 0) return { min: 0, max: 0 };
        const lows = candles.map(c => c.low);
        const highs = candles.map(c => c.high);
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        const padding = (max - min) * 0.1; // 10% padding
        return { min: min - padding, max: max + padding };
    }, [candles]);
    
    const maxCandles = candles.length;
    const range = priceRange.max - priceRange.min;
    
    if (range <= 0) return <div className="h-96 bg-gray-800 rounded-md flex items-center justify-center text-gray-500">Not enough data to display chart.</div>;

    const getYPosition = (price: number) => ((price - priceRange.min) / range) * 100;

    return (
        <div className="bg-gray-800 h-96 rounded-md flex items-center justify-center p-4 relative overflow-hidden">
            {/* Y-Axis */}
            <div className="absolute top-0 right-2 h-full flex flex-col justify-between py-1 text-xs text-gray-500 z-10">
                <span>{priceRange.max.toFixed(0)}</span>
                <span>{(priceRange.min + (priceRange.max - priceRange.min) / 2).toFixed(0)}</span>
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
                        {/* Wick */}
                        <div className="absolute bg-gray-500 mx-auto left-0 right-0" style={{ bottom: `${wickBottomPos}%`, height: `${Math.max(0, wickHeight)}%`, width: '2px' }}></div>
                        {/* Body */}
                        <div className={`absolute mx-auto left-0 right-0 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`} style={{ bottom: `${bodyBottomPos}%`, height: `${Math.max(0, bodyHeight)}%`, width: '60%' }}></div>
                    </div>
                );
            })}

            {/* Trades */}
            {trades.map((trade, index) => {
                const entryX = (trade.entryIndex / maxCandles) * 100 + (0.5 / maxCandles) * 100;
                const exitX = (trade.exitIndex / maxCandles) * 100 + (0.5 / maxCandles) * 100;
                const entryY = getYPosition(trade.entryPrice);
                const exitY = getYPosition(trade.exitPrice);
                const isProfit = (trade.type === 'BUY' && trade.exitPrice > trade.entryPrice) || (trade.type === 'SELL' && trade.exitPrice < trade.entryPrice);

                return (
                    <React.Fragment key={index}>
                        {/* Connecting Line */}
                        <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                             <line x1={`${entryX}%`} y1={`${100 - entryY}%`} x2={`${exitX}%`} y2={`${100 - exitY}%`} stroke={isProfit ? '#22c55e' : '#ef4444'} strokeWidth="2" strokeDasharray="4" />
                        </svg>
                        {/* Entry Marker */}
                         <div className="absolute" style={{ left: `${entryX}%`, bottom: `${entryY}%`, transform: 'translate(-50%, 50%)' }}>
                            <i className={`fa-solid ${trade.type === 'BUY' ? 'fa-arrow-circle-up text-green-400' : 'fa-arrow-circle-down text-red-400'} bg-gray-900 rounded-full text-lg`}></i>
                        </div>
                        {/* Exit Marker */}
                        <div className="absolute" style={{ left: `${exitX}%`, bottom: `${exitY}%`, transform: 'translate(-50%, 50%)' }}>
                            <i className="fa-solid fa-times-circle text-gray-400 bg-gray-900 rounded-full text-lg"></i>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const Backtesting: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [period, setPeriod] = useState<string>('3'); // Default to 3 years

    const handleRunBacktest = async () => {
        setIsLoading(true);
        setResults(null);
        
        const backtestConfig = {
            period,
            timeframe: '3m', // Example value
            stopLoss: 0.5, // Example value
            takeProfit: 1.0 // Example value
        };
        
        try {
            const apiResults = await runBacktest(backtestConfig);
            setResults(apiResults);
        } catch (error) {
            console.error("Backtest failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SectionCard title="Backtesting Engine" iconClass="fa-solid fa-backward-fast">
            <p className="text-gray-400 mb-6">
                Validate the effectiveness of the trading logic and your custom rule configurations by running simulations on historical data. This module helps build confidence and identify potential areas for strategy improvement.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-white mb-4">Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="date-range" className="block text-sm font-medium text-gray-300 mb-1">Historical Data Range</label>
                            <select 
                                id="date-range" 
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                            >
                                <option value="1">Past 1 Year</option>
                                <option value="3">Past 3 Years</option>
                                <option value="5">Past 5 Years</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                            <div className="flex items-center gap-2">
                                {['1m', '3m', '5m', '15m'].map(tf => (
                                     <button key={tf} className={`px-3 py-1 text-sm rounded-md ${tf === '3m' ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>{tf}</button>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="sl" className="block text-sm font-medium text-gray-300 mb-1">Stop-Loss (%)</label>
                            <input type="number" id="sl" defaultValue="0.5" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="tp" className="block text-sm font-medium text-gray-300 mb-1">Take-Profit (%)</label>
                            <input type="number" id="tp" defaultValue="1.0" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                        </div>
                    </div>
                    <button onClick={handleRunBacktest} disabled={isLoading} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                         {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Running...</> : <><i className="fas fa-play"></i> Run Backtest</>}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-white mb-4">Backtest Results</h3>
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <i className="fas fa-chart-line text-5xl mb-4 animate-pulse"></i>
                            <p className="text-lg">Analyzing historical data...</p>
                         </div>
                    )}
                    {!isLoading && !results && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                           <i className="fas fa-vial-circle-check text-5xl mb-4"></i>
                           <p className="text-lg">Ready to run analysis</p>
                           <p className="text-sm">Configure parameters and click "Run Backtest".</p>
                        </div>
                    )}
                    {results && (
                        <div className="space-y-6">
                             <div className="text-center">
                                <span className="text-sm text-gray-400">Showing results for: </span>
                                <span className="font-semibold text-white bg-gray-700 px-3 py-1 rounded-full">{results.period}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-gray-800 p-3 rounded-md">
                                    <div className="text-sm text-gray-400">Win Rate</div>
                                    <div className="text-xl font-bold text-green-400">{results.winRate}</div>
                                </div>
                                 <div className="bg-gray-800 p-3 rounded-md">
                                    <div className="text-sm text-gray-400">Profit Factor</div>
                                    <div className="text-xl font-bold text-white">{results.profitFactor}</div>
                                </div>
                                <div className="bg-gray-800 p-3 rounded-md">
                                    <div className="text-sm text-gray-400">Total Trades</div>
                                    <div className="text-xl font-bold text-white">{results.totalTrades}</div>
                                </div>
                                <div className="bg-gray-800 p-3 rounded-md">
                                    <div className="text-sm text-gray-400">Max Drawdown</div>
                                    <div className="text-xl font-bold text-red-400">{results.maxDrawdown}</div>
                                </div>
                            </div>
                             <h4 className="font-semibold text-white text-center">Equity Curve & Trade Visualization</h4>
                             <BacktestChart candles={results.candles || []} trades={results.trades || []} />
                        </div>
                    )}
                </div>
            </div>
        </SectionCard>
    );
}

export default Backtesting;
