import React, { useState } from 'react';
import SectionCard from './SectionCard';

const Backtesting: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const [period, setPeriod] = useState<string>('3'); // Default to 3 years

    const handleRunBacktest = () => {
        setIsLoading(true);
        setResults(null);
        setTimeout(() => {
            // Mock results based on the selected period
            let mockResults;
            switch (period) {
                case '1':
                    mockResults = {
                        period: "1 Year",
                        winRate: "71.2%",
                        profitFactor: "2.3",
                        totalTrades: "151",
                        maxDrawdown: "9.8%",
                    };
                    break;
                case '5':
                     mockResults = {
                        period: "5 Years",
                        winRate: "67.9%",
                        profitFactor: "1.9",
                        totalTrades: "743",
                        maxDrawdown: "14.1%",
                    };
                    break;
                case '3':
                default:
                    mockResults = {
                        period: "3 Years",
                        winRate: "68.5%",
                        profitFactor: "2.1",
                        totalTrades: "452",
                        maxDrawdown: "12.3%",
                    };
                    break;
            }
            setResults(mockResults);
            setIsLoading(false);
        }, 2000);
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
                        <div>
                             <div className="text-center mb-6">
                                <span className="text-sm text-gray-400">Showing results for: </span>
                                <span className="font-semibold text-white bg-gray-700 px-3 py-1 rounded-full">{results.period}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
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
                            <div className="bg-gray-800 h-48 rounded-md flex items-center justify-center">
                               <p className="text-gray-500"><i className="fas fa-chart-area mr-2"></i>Equity Curve Chart Placeholder</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SectionCard>
    );
}

export default Backtesting;