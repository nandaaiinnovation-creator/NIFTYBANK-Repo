import React, { useState } from 'react';
import { runBacktest } from '../services/api';
import { SignalDirection, type BacktestSignal, type BacktestResults } from '../types';
import { useBroker } from '../contexts/BrokerContext';
import TradingViewChart from './TradingViewChart';
import EquityChart from './EquityChart';

const ResultsMetric: React.FC<{ label: string; value: string | number; color?: string; size?: 'normal' | 'large' }> = ({ label, value, color = 'text-white', size = 'normal' }) => (
    <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm">
        <div className={`text-xs ${size === 'large' ? 'sm:text-sm' : ''} text-gray-400`}>{label}</div>
        <div className={`font-bold ${color} ${size === 'large' ? 'text-xl sm:text-2xl' : 'text-lg'}`}>{value}</div>
    </div>
);

const SignalDetailsPanel: React.FC<{ signal: BacktestSignal; onClose: () => void }> = ({ signal, onClose }) => {
    const isBuy = signal.direction === SignalDirection.BUY;
    const directionColor = isBuy ? 'text-green-400' : 'text-red-400';
    const directionBg = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';

    return (
        <div className="h-full flex flex-col bg-zinc-900 border border-zinc-800 p-2 animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h4 className="font-semibold text-white text-xs">Signal Details</h4>
                <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded-sm">&times; Close</button>
            </div>
            <div className={`p-2 rounded-sm mb-2 ${directionBg}`}>
                <div className="flex justify-between items-center">
                    <span className={`font-bold text-lg ${directionColor}`}>{signal.direction}</span>
                    <span className="font-mono text-white text-lg">{signal.price.toFixed(2)}</span>
                </div>
                <div className="text-xs text-zinc-400 text-right">{new Date(signal.time).toLocaleString()}</div>
            </div>
            <div className="mb-2 flex-shrink-0">
                <div className="text-xs text-zinc-400">Conviction</div>
                <div className="w-full bg-zinc-700 rounded-full h-2.5">
                    <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${signal.conviction}%` }}></div>
                </div>
                <div className="text-right font-bold text-white text-sm">{signal.conviction}%</div>
            </div>
            <div className="flex-grow grid grid-cols-2 gap-2 overflow-hidden">
                <div className="flex flex-col">
                    <h5 className="text-xs font-semibold text-green-400 mb-1 flex-shrink-0">Rules Passed ({signal.rulesPassed.length})</h5>
                    <div className="bg-zinc-800 p-1 rounded-sm space-y-0.5 overflow-y-auto">
                         <ul className="text-xs text-zinc-300">
                            {signal.rulesPassed.map(rule => <li key={rule} className="truncate p-0.5">&#x2713; {rule}</li>)}
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col">
                    <h5 className="text-xs font-semibold text-red-400 mb-1 flex-shrink-0">Rules Failed ({signal.rulesFailed.length})</h5>
                     <div className="bg-zinc-800 p-1 rounded-sm space-y-0.5 overflow-y-auto">
                        <ul className="text-xs text-zinc-400">
                            {signal.rulesFailed.map(rule => <li key={rule} className="truncate p-0.5">&#x2717; {rule}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Backtesting: React.FC = () => {
    const { status: brokerStatus } = useBroker();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSignal, setSelectedSignal] = useState<BacktestSignal | null>(null);
    const [config, setConfig] = useState({
        instrument: 'BANKNIFTY',
        period: '1 month',
        timeframe: '3m',
        sl: '0.5',
        tp: '1.0',
        tradeExitStrategy: 'stop' as 'stop' | 'signal',
        dateRangeType: 'period',
        from: '',
        to: new Date().toISOString().split('T')[0],
    });
    const [chartKey, setChartKey] = useState(1);

    const handleSignalClick = (signal: BacktestSignal) => {
        setSelectedSignal(signal);
    };

    const handleRunBacktest = async () => {
        if (brokerStatus !== 'connected') {
            setError('Please connect to the broker on the Live Dashboard page before running a backtest.');
            return;
        }
        
        setError(null);
        setSelectedSignal(null);

        let fromTimestamp = 0;
        let toTimestamp = 0;
        let periodForCache = config.period;

        if (config.dateRangeType === 'custom') {
            if (!config.from || !config.to) {
                setError('Please select both a "From" and "To" date for the custom range.');
                return;
            }
            fromTimestamp = new Date(config.from).getTime() / 1000;
            const toDate = new Date(config.to);
            toDate.setHours(23, 59, 59, 999);
            toTimestamp = toDate.getTime() / 1000;
            periodForCache = `${fromTimestamp}-${toTimestamp}`;
        }
        
        const cacheKey = `backtest-${config.instrument}-${periodForCache}-${config.timeframe}-${config.sl}-${config.tp}-${config.tradeExitStrategy}`;
        try {
            const cachedDataString = sessionStorage.getItem(cacheKey);
            if (cachedDataString) {
                console.log("Loading backtest results from session cache.");
                const cachedData = JSON.parse(cachedDataString);
                setResults(cachedData);
                sessionStorage.setItem('latestBacktestResults', JSON.stringify(cachedData));
                setChartKey(prev => prev + 1);
                return;
            }
        } catch (e) {
            console.error("Failed to parse cached backtest data:", e);
            sessionStorage.removeItem(cacheKey);
        }

        setIsLoading(true);
        setResults(null);
        
        try {
            const apiResults = await runBacktest({ 
                instrument: config.instrument,
                period: config.period,
                timeframe: config.timeframe,
                from: fromTimestamp, 
                to: toTimestamp, 
                sl: parseFloat(config.sl),
                tp: parseFloat(config.tp),
                tradeExitStrategy: config.tradeExitStrategy,
            });
            setResults(apiResults);
            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(apiResults));
                sessionStorage.setItem('latestBacktestResults', JSON.stringify(apiResults));
            } catch (e) {
                console.error("Failed to save backtest results to session cache:", e);
            }
            setChartKey(prev => prev + 1);
        } catch (err: any) {
            console.error("Backtest failed:", err);
            setError(err.message || "An unknown error occurred during the backtest.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const timeframes = ['1m', '3m', '5m', '15m'];
    const periods = ['1 month', '3 months', '6 months', '1 year', '3 years', '5 years', 'Custom Range'];
    const instruments = ['BANKNIFTY', 'NIFTY 50'];

    return (
        <div className="bg-zinc-900 border border-zinc-700 h-full flex flex-col p-2 gap-2">
            <div className="flex items-center flex-shrink-0">
                <i className="fa-solid fa-backward-fast text-md text-cyan-400 mr-2"></i>
                <h2 className="text-md font-semibold text-white">Backtesting Engine</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-grow overflow-hidden">
                <div className="lg:col-span-1 bg-zinc-950 p-3 border border-zinc-800 flex flex-col">
                    <h3 className="font-semibold text-white mb-3 text-sm">Configuration</h3>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="instrument" className="block text-xs font-medium text-gray-400 mb-1">Instrument</label>
                            <select 
                                id="instrument" 
                                className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm"
                                value={config.instrument}
                                onChange={(e) => setConfig(prev => ({ ...prev, instrument: e.target.value }))}
                            >
                                {instruments.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date-range" className="block text-xs font-medium text-gray-400 mb-1">Historical Data Range</label>
                            <select 
                                id="date-range" 
                                className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm"
                                value={config.dateRangeType === 'custom' ? 'Custom Range' : config.period}
                                onChange={(e) => {
                                    if (e.target.value === 'Custom Range') {
                                        setConfig(prev => ({ ...prev, dateRangeType: 'custom' }));
                                    } else {
                                        setConfig(prev => ({ ...prev, dateRangeType: 'period', period: e.target.value }));
                                    }
                                }}
                            >
                                {periods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        {config.dateRangeType === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                    <label htmlFor="from-date" className="block text-xs font-medium text-gray-400 mb-1">From</label>
                                    <input type="date" id="from-date" value={config.from} onChange={e => setConfig(prev => ({...prev, from: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm" />
                                </div>
                                <div>
                                    <label htmlFor="to-date" className="block text-xs font-medium text-gray-400 mb-1">To</label>
                                    <input type="date" id="to-date" value={config.to} onChange={e => setConfig(prev => ({...prev, to: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm" />
                                </div>
                            </div>
                        )}

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

                        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <label htmlFor="signal-mode-toggle" className="text-xs font-medium text-gray-400">Signal-to-Signal Mode</label>
                                <label htmlFor="signal-mode-toggle" className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input id="signal-mode-toggle" type="checkbox" className="sr-only" checked={config.tradeExitStrategy === 'signal'} onChange={() => setConfig(p => ({...p, tradeExitStrategy: p.tradeExitStrategy === 'signal' ? 'stop' : 'signal'}))} />
                                        <div className={`block w-10 h-5 rounded-full transition-colors ${config.tradeExitStrategy === 'signal' ? 'bg-cyan-500' : 'bg-zinc-600'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${config.tradeExitStrategy === 'signal' ? 'transform translate-x-5' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                            <div className={`grid grid-cols-2 gap-3 transition-opacity ${config.tradeExitStrategy === 'signal' ? 'opacity-50' : 'opacity-100'}`}>
                                <div>
                                    <label htmlFor="sl" className="block text-xs font-medium text-gray-400 mb-1">Stop Loss (%)</label>
                                    <input type="number" id="sl" value={config.sl} onChange={e => setConfig(prev => ({...prev, sl: e.target.value}))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                </div>
                                <div>
                                    <label htmlFor="tp" className="block text-xs font-medium text-gray-400 mb-1">Take Profit (%)</label>
                                    <input type="number" id="tp" value={config.tp} onChange={e => setConfig(prev => ({...prev, tp: e.target.value}))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                </div>
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
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <ResultsMetric label="Net Profit (Points)" value={results.netProfit.toFixed(2)} color={results.netProfit > 0 ? 'text-green-400' : 'text-red-400'} size="large" />
                                <ResultsMetric label="Win Rate" value={results.winRate} color="text-cyan-400" size="large" />
                                <ResultsMetric label="Total Trades" value={results.totalTrades} size="large" />
                                <ResultsMetric label="Max Drawdown" value={results.maxDrawdown} color="text-red-400" size="large" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <ResultsMetric label="Profit Factor" value={results.profitFactor} />
                                <ResultsMetric label="Avg Win / Loss" value={`${results.avgWin.toFixed(1)} / ${results.avgLoss.toFixed(1)}`} />
                                <ResultsMetric label="Total Wins" value={results.totalWins} color="text-green-400" />
                                <ResultsMetric label="Total Losses" value={results.totalLosses} color="text-red-400" />
                            </div>
                             
                             <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-2 overflow-hidden">
                                <div className="min-h-[250px] xl:h-auto flex flex-col">
                                    <h4 className="font-semibold text-white text-center text-xs mb-1">Signal Visualization</h4>
                                    <div className="h-full w-full bg-zinc-900 border border-zinc-800 flex-grow">
                                        <TradingViewChart 
                                            key={chartKey}
                                            isLive={false}
                                            backtestConfig={config}
                                            initialData={results.candles}
                                            signals={results.signals}
                                            onSignalClick={handleSignalClick}
                                        />
                                    </div>
                                </div>
                                <div className="min-h-[250px] xl:h-auto flex flex-col">
                                     {selectedSignal ? (
                                        <SignalDetailsPanel signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
                                     ) : (
                                        <>
                                            <h4 className="font-semibold text-white text-center text-xs mb-1">Equity Curve</h4>
                                            <div className="flex-grow overflow-y-auto bg-zinc-900 border border-zinc-800 p-1 space-y-1">
                                                <EquityChart data={results.equityCurve} />
                                            </div>
                                        </>
                                     )}
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
