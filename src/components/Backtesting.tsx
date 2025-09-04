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
        timeframe: '5m',
        sl: '0.5',
        tp: '1.0',
        tradeExitStrategy: 'stop' as 'stop' | 'signal',
        dateRangeType: 'period',
        from: '',
        to: new Date().toISOString().split('T')[0],
        // New advanced config
        mode: 'simple' as 'simple' | 'walk-forward',
        stopLossType: 'percent' as 'percent' | 'atr',
        atrMultiplier: '1.5',
        walkForwardTrain: '12', // in months
        walkForwardTest: '3', // in months
    });
    const [chartKey, setChartKey] = useState(1);

    const handleSignalClick = (signal: BacktestSignal) => setSelectedSignal(signal);

    const handleRunBacktest = async () => {
        if (brokerStatus !== 'connected') {
            setError('Please connect to the broker on the Live Dashboard page before running a backtest.');
            return;
        }
        
        setError(null);
        setSelectedSignal(null);
        setIsLoading(true);
        setResults(null);

        let fromTimestamp = 0;
        let toTimestamp = 0;

        if (config.dateRangeType === 'custom') {
            if (!config.from || !config.to) {
                setError('Please select both a "From" and "To" date for the custom range.');
                setIsLoading(false);
                return;
            }
            fromTimestamp = new Date(config.from).getTime() / 1000;
            const toDate = new Date(config.to);
            toDate.setHours(23, 59, 59, 999);
            toTimestamp = toDate.getTime() / 1000;
        }
        
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
                // Pass advanced params
                mode: config.mode,
                stopLossType: config.stopLossType,
                atrMultiplier: parseFloat(config.atrMultiplier),
                walkForwardTrain: parseInt(config.walkForwardTrain, 10),
                walkForwardTest: parseInt(config.walkForwardTest, 10),
            });
            setResults(apiResults);
            sessionStorage.setItem('latestBacktestResults', JSON.stringify(apiResults));
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
                <div className="lg:col-span-1 bg-zinc-950 p-2 border border-zinc-800 flex flex-col overflow-y-auto">
                    <h3 className="font-semibold text-white mb-2 text-sm">Configuration</h3>
                    <div className="space-y-3">
                        {/* Instrument & Date Range */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Instrument</label>
                            <select value={config.instrument} onChange={(e) => setConfig(prev => ({ ...prev, instrument: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs rounded-sm">
                                {instruments.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Historical Range</label>
                            <select value={config.dateRangeType === 'custom' ? 'Custom Range' : config.period} onChange={(e) => setConfig(prev => ({ ...prev, dateRangeType: e.target.value === 'Custom Range' ? 'custom' : 'period', period: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs rounded-sm">
                                {periods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        {config.dateRangeType === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
                                    <input type="date" value={config.from} onChange={e => setConfig(prev => ({...prev, from: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
                                    <input type="date" value={config.to} onChange={e => setConfig(prev => ({...prev, to: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm" />
                                </div>
                            </div>
                        )}
                        {/* Timeframe */}
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2">Timeframe</label>
                            <div className="flex items-center gap-2">
                                {timeframes.map(tf => (<button key={tf} onClick={() => setConfig(prev => ({ ...prev, timeframe: tf }))} className={`px-2 py-1 text-xs rounded-sm ${config.timeframe === tf ? 'bg-cyan-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'}`}>{tf}</button>))}
                            </div>
                        </div>
                        
                        {/* Advanced Strategy Config */}
                        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-sm space-y-3">
                            <h4 className="text-xs font-semibold text-cyan-400">Strategy & Risk</h4>
                             {/* Backtest Mode */}
                             <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Backtest Mode</label>
                                <select value={config.mode} onChange={(e) => setConfig(prev => ({ ...prev, mode: e.target.value as any }))} className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs rounded-sm">
                                    <option value="simple">Simple</option>
                                    <option value="walk-forward">Walk-Forward Optimization</option>
                                </select>
                            </div>

                            {config.mode === 'walk-forward' && (
                                <div className="grid grid-cols-2 gap-3 animate-fade-in bg-zinc-800/50 p-2 rounded-sm border border-zinc-700">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Train (Months)</label>
                                        <input type="number" value={config.walkForwardTrain} onChange={e => setConfig(prev => ({...prev, walkForwardTrain: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Test (Months)</label>
                                        <input type="number" value={config.walkForwardTest} onChange={e => setConfig(prev => ({...prev, walkForwardTest: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm" />
                                    </div>
                                </div>
                            )}

                             {/* Exit Strategy */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-400">Exit Strategy</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setConfig(p => ({...p, tradeExitStrategy: 'stop'}))} className={`px-2 py-1 text-xs rounded-sm ${config.tradeExitStrategy === 'stop' ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-gray-300'}`}>SL/TP</button>
                                    <button onClick={() => setConfig(p => ({...p, tradeExitStrategy: 'signal'}))} className={`px-2 py-1 text-xs rounded-sm ${config.tradeExitStrategy === 'signal' ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-gray-300'}`}>Signal-to-Signal</button>
                                </div>
                            </div>
                            
                            {/* SL/TP Config */}
                            <div className={`space-y-3 transition-opacity ${config.tradeExitStrategy === 'signal' ? 'opacity-50' : 'opacity-100'}`}>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Stop Loss Type</label>
                                    <select value={config.stopLossType} onChange={(e) => setConfig(prev => ({ ...prev, stopLossType: e.target.value as any }))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 py-1.5 px-2 text-white text-xs rounded-sm disabled:cursor-not-allowed">
                                        <option value="percent">Percentage (%)</option>
                                        <option value="atr">ATR Multiplier</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {config.stopLossType === 'percent' ? (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Stop Loss (%)</label>
                                                <input type="number" value={config.sl} onChange={e => setConfig(prev => ({...prev, sl: e.target.value}))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Take Profit (%)</label>
                                                <input type="number" value={config.tp} onChange={e => setConfig(prev => ({...prev, tp: e.target.value}))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                             <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">ATR Multiplier (SL)</label>
                                                <input type="number" value={config.atrMultiplier} onChange={e => setConfig(prev => ({...prev, atrMultiplier: e.target.value}))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                            </div>
                                             <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Risk/Reward (TP)</label>
                                                {/* FIX: Corrected a type error by parsing config.tp to a number before division. Also fixed a stale state bug in onChange by using the value from the previous state. */}
                                                <input type="number" value={parseFloat(config.tp) / parseFloat(config.sl)} onChange={e => setConfig(prev => ({...prev, tp: (parseFloat(e.target.value) * parseFloat(prev.sl)).toString() }))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto pt-3">
                         <button onClick={handleRunBacktest} disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 text-sm rounded-sm flex items-center justify-center gap-2">
                            {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Running...</> : <><i className="fas fa-play"></i> Run Backtest</>}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-zinc-950 p-2 border border-zinc-800 min-h-[400px] flex flex-col">
                    <h3 className="font-semibold text-white mb-2 text-sm">Backtest Results</h3>
                    {isLoading && <div className="flex flex-col items-center justify-center h-full text-zinc-500"><i className="fas fa-chart-line text-4xl mb-3 animate-pulse"></i><p className="text-md">Fetching & Analyzing Historical Data...</p>{config.mode === 'walk-forward' && <p className="text-sm mt-2">Walk-forward analysis may take several minutes.</p>}</div>}
                    {!isLoading && !results && <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-center"><i className="fas fa-vial-circle-check text-4xl mb-3"></i><p className="text-md">Ready to run analysis</p><p className="text-xs mt-1">{error ? <span className="text-red-400">{error}</span> : 'Configure parameters and click "Run Backtest".'}</p></div>}
                    
                    {results && (
                        <div className="flex-grow flex flex-col gap-2 overflow-hidden">
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <ResultsMetric label="Net Profit (Points)" value={results.netProfit.toFixed(2)} color={results.netProfit > 0 ? 'text-green-400' : 'text-red-400'} size="large" />
                                <ResultsMetric label="Win Rate" value={results.winRate} color="text-cyan-400" size="large" />
                                <ResultsMetric label="Total Trades" value={results.totalTrades} size="large" />
                                <ResultsMetric label="Max Drawdown" value={results.maxDrawdown} color="text-red-400" size="large" />
                            </div>
                            {results.mode !== 'walk-forward' &&
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                    <ResultsMetric label="Profit Factor" value={results.profitFactor} />
                                    <ResultsMetric label="Avg Win / Loss" value={`${results.avgWin.toFixed(1)} / ${results.avgLoss.toFixed(1)}`} />
                                    <ResultsMetric label="Total Wins" value={results.totalWins} color="text-green-400" />
                                    <ResultsMetric label="Total Losses" value={results.totalLosses} color="text-red-400" />
                                </div>
                            }
                             <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-2 overflow-hidden">
                                <div className="min-h-[250px] xl:h-auto flex flex-col">
                                    <h4 className="font-semibold text-white text-center text-xs mb-1">{results.mode === 'walk-forward' ? 'Walk-Forward Equity Curve' : 'Equity Curve'}</h4>
                                    <div className="flex-grow overflow-y-auto bg-zinc-900 border border-zinc-800 p-1 space-y-1">
                                        <EquityChart data={results.equityCurve} />
                                    </div>
                                </div>
                                <div className="min-h-[250px] xl:h-auto flex flex-col">
                                     {selectedSignal ? (
                                        <SignalDetailsPanel signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
                                     ) : (
                                        <>
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