import React, { useState } from 'react';
import { runBacktest } from '../services/api';
import { SignalDirection, type BacktestSignal, type BacktestResults, type BacktestTrade } from '../types';
import { useBroker } from '../contexts/BrokerContext';
import TradingViewChart from './TradingViewChart';
import EquityChart from './EquityChart';

const ResultsMetric: React.FC<{ label: string; value: string | number; color?: string; size?: 'normal' | 'large' }> = ({ label, value, color = 'text-white', size = 'normal' }) => (
    <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm">
        <div className={`text-xs ${size === 'large' ? 'sm:text-sm' : ''} text-gray-400`}>{label}</div>
        <div className={`font-bold ${color} ${size === 'large' ? 'text-xl sm:text-2xl' : 'text-lg'}`}>{value}</div>
    </div>
);

const TradeLog: React.FC<{ trades: BacktestTrade[] }> = ({ trades }) => {
    if (!trades || trades.length === 0) {
        return <div className="flex items-center justify-center h-full text-zinc-500">No trades were executed in this backtest.</div>;
    }

    const formatTime = (isoString: string) => new Date(isoString).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="h-full overflow-y-auto">
            <table className="w-full text-xs text-left text-zinc-400">
                <thead className="text-xs text-zinc-300 uppercase bg-zinc-800 sticky top-0">
                    <tr>
                        <th className="px-2 py-1.5">Direction</th>
                        <th className="px-2 py-1.5">Entry Time</th>
                        <th className="px-2 py-1.5">Entry Price</th>
                        <th className="px-2 py-1.5">Exit Time</th>
                        <th className="px-2 py-1.5">Exit Price</th>
                        <th className="px-2 py-1.5 text-right">P&L (Points)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {trades.map((trade, index) => (
                        <tr key={index} className="hover:bg-zinc-800/50">
                            <td className={`px-2 py-1.5 font-bold ${trade.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{trade.direction}</td>
                            <td className="px-2 py-1.5 font-mono">{formatTime(trade.entryTime)}</td>
                            <td className="px-2 py-1.5 font-mono">{trade.entryPrice.toFixed(2)}</td>
                            <td className="px-2 py-1.5 font-mono">{formatTime(trade.exitTime)}</td>
                            <td className="px-2 py-1.5 font-mono">{trade.exitPrice.toFixed(2)}</td>
                            <td className={`px-2 py-1.5 font-mono font-bold text-right ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const SignalDetailsPanel: React.FC<{ signal: BacktestSignal }> = ({ signal }) => {
    const isBuy = signal.direction.includes('BUY');
    const directionColor = isBuy ? 'text-green-400' : 'text-red-400';
    const directionBg = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';

    return (
        <div className="h-full flex flex-col p-1">
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
    const [activeTab, setActiveTab] = useState<'summary' | 'equity' | 'chart' | 'log' | 'signal'>('summary');
    const [isConfigOpen, setIsConfigOpen] = useState(true);
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
        mode: 'simple' as 'simple' | 'walk-forward',
        stopLossType: 'percent' as 'percent' | 'atr',
        atrMultiplier: '1.5',
        walkForwardTrain: '12',
        walkForwardTest: '3',
    });
    const [chartKey, setChartKey] = useState(1);

    const handleSignalClick = (signal: BacktestSignal) => {
        setSelectedSignal(signal);
        setActiveTab('signal');
    };

    const handleRunBacktest = async () => {
        if (brokerStatus !== 'connected') {
            setError('Please connect to the broker on the Live Dashboard page before running a backtest.');
            return;
        }
        
        setError(null);
        setSelectedSignal(null);
        setIsLoading(true);
        setResults(null);
        setActiveTab('summary');

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
                mode: config.mode,
                stopLossType: config.stopLossType,
                atrMultiplier: parseFloat(config.atrMultiplier),
                walkForwardTrain: parseInt(config.walkForwardTrain, 10) * 21, // Approx days
                walkForwardTest: parseInt(config.walkForwardTest, 10) * 21, // Approx days
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
    
    const TabButton: React.FC<{tabId: string, currentTab: string, children: React.ReactNode, disabled?: boolean}> = ({tabId, currentTab, children, disabled}) => (
        <button 
            onClick={() => !disabled && setActiveTab(tabId as any)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${currentTab === tabId ? 'text-cyan-400 border-cyan-400' : 'text-zinc-400 border-transparent hover:text-white'} disabled:text-zinc-600 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-zinc-900 border border-zinc-700 h-full flex flex-col p-2 gap-2">
            <div className="flex items-center flex-shrink-0">
                <i className="fa-solid fa-backward-fast text-md text-cyan-400 mr-2"></i>
                <h2 className="text-md font-semibold text-white">Backtesting Engine</h2>
            </div>
            
            <div className="flex-grow space-y-4 overflow-y-auto">
                {/* --- CONFIGURATION PANEL --- */}
                <div className="bg-zinc-950 border border-zinc-800">
                     <button onClick={() => setIsConfigOpen(!isConfigOpen)} className="w-full flex justify-between items-center p-3 hover:bg-zinc-800/50">
                        <h3 className="font-semibold text-white text-sm">Configuration</h3>
                        <i className={`fa-solid fa-chevron-down text-zinc-400 transition-transform ${isConfigOpen ? '' : '-rotate-90'}`}></i>
                     </button>
                     
                     {isConfigOpen && (
                        <div className="p-3 border-t border-zinc-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Scope */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-cyan-400 border-b border-zinc-800 pb-1">Scope</h4>
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
                                </div>
                                {/* Timeframe */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-cyan-400 border-b border-zinc-800 pb-1">Timeframe</h4>
                                    <div className="flex items-center gap-2">
                                        {timeframes.map(tf => (<button key={tf} onClick={() => setConfig(prev => ({ ...prev, timeframe: tf }))} className={`px-2 py-1 text-xs rounded-sm ${config.timeframe === tf ? 'bg-cyan-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'}`}>{tf}</button>))}
                                    </div>
                                </div>
                                {/* Strategy */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-cyan-400 border-b border-zinc-800 pb-1">Strategy & Risk</h4>
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-gray-400">Exit Strategy</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setConfig(p => ({...p, tradeExitStrategy: 'stop'}))} className={`px-2 py-1 text-xs rounded-sm ${config.tradeExitStrategy === 'stop' ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-gray-300'}`}>SL/TP</button>
                                            <button onClick={() => setConfig(p => ({...p, tradeExitStrategy: 'signal'}))} className={`px-2 py-1 text-xs rounded-sm ${config.tradeExitStrategy === 'signal' ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-gray-300'}`}>Signal-to-Signal</button>
                                        </div>
                                    </div>
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
                                                        <input type="number" value={parseFloat(config.sl) > 0 ? parseFloat(config.tp) / parseFloat(config.sl) : 0} onChange={e => setConfig(prev => ({...prev, tp: (parseFloat(e.target.value) * parseFloat(prev.sl)).toString() }))} disabled={config.tradeExitStrategy === 'signal'} className="w-full bg-zinc-800 border border-zinc-700 p-1 text-white text-xs rounded-sm disabled:cursor-not-allowed" step="0.1" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Mode */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-cyan-400 border-b border-zinc-800 pb-1">Optimization</h4>
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
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                 <button onClick={handleRunBacktest} disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 text-sm rounded-sm flex items-center justify-center gap-2">
                                    {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Running...</> : <><i className="fas fa-play"></i> Run Backtest</>}
                                </button>
                            </div>
                        </div>
                     )}
                </div>

                {/* --- RESULTS PANEL --- */}
                 <div className="bg-zinc-950 p-2 border border-zinc-800 min-h-[600px] flex flex-col">
                    <h3 className="font-semibold text-white mb-2 text-sm flex-shrink-0">Backtest Results</h3>
                    {isLoading && <div className="flex flex-col items-center justify-center flex-grow text-zinc-500"><i className="fas fa-chart-line text-4xl mb-3 animate-pulse"></i><p className="text-md">Fetching & Analyzing Historical Data...</p>{config.mode === 'walk-forward' && <p className="text-sm mt-2">Walk-forward analysis may take several minutes.</p>}</div>}
                    {!isLoading && !results && <div className="flex flex-col items-center justify-center flex-grow text-zinc-600 text-center"><i className="fas fa-vial-circle-check text-4xl mb-3"></i><p className="text-md">Ready to run analysis</p><p className="text-xs mt-1">{error ? <span className="text-red-400">{error}</span> : 'Configure parameters and click "Run Backtest".'}</p></div>}
                    
                    {results && (
                        <div className="flex-grow flex flex-col gap-2 overflow-hidden">
                             {/* Top Level Metrics */}
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center flex-shrink-0">
                                <ResultsMetric label="Net Profit (Points)" value={results.netProfit.toFixed(2)} color={results.netProfit > 0 ? 'text-green-400' : 'text-red-400'} size="large" />
                                <ResultsMetric label="Win Rate" value={results.winRate} color="text-cyan-400" size="large" />
                                <ResultsMetric label="Total Trades" value={results.totalTrades} size="large" />
                                <ResultsMetric label="Max Drawdown" value={results.maxDrawdown} color="text-red-400" size="large" />
                            </div>
                            
                            {/* Tab Navigation */}
                             <div className="border-b border-zinc-800 flex-shrink-0">
                                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                                    <TabButton tabId="summary" currentTab={activeTab}>Summary</TabButton>
                                    <TabButton tabId="equity" currentTab={activeTab}>Equity Curve</TabButton>
                                    <TabButton tabId="chart" currentTab={activeTab}>Price Chart</TabButton>
                                    <TabButton tabId="log" currentTab={activeTab}>Trade Log</TabButton>
                                    {selectedSignal && 
                                        <TabButton tabId="signal" currentTab={activeTab}>
                                            <i className="fa-solid fa-circle-info mr-2 text-cyan-400"></i>Signal Details
                                        </TabButton>
                                    }
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-grow bg-zinc-900 border border-zinc-800 overflow-hidden">
                                {activeTab === 'summary' && (
                                    <div className="p-2 h-full overflow-y-auto">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
                                            <ResultsMetric label="Profit Factor" value={results.profitFactor} />
                                            <ResultsMetric label="Avg Win / Loss" value={`${results.avgWin.toFixed(1)} / ${results.avgLoss.toFixed(1)}`} />
                                            <ResultsMetric label="Total Wins" value={results.totalWins} color="text-green-400" />
                                            <ResultsMetric label="Total Losses" value={results.totalLosses} color="text-red-400" />
                                        </div>
                                        {results.mode === 'walk-forward' && results.walkForwardPeriods && (
                                            <div>
                                                 <h4 className="font-semibold text-white text-center text-sm mb-2">Walk-Forward Periods</h4>
                                                 <div className="overflow-x-auto max-h-64">
                                                     <table className="w-full text-xs text-left text-zinc-400">
                                                         <thead className="text-xs text-zinc-300 uppercase bg-zinc-800 sticky top-0">
                                                             <tr>
                                                                <th className="px-2 py-1">Period</th>
                                                                <th className="px-2 py-1">Train Dates</th>
                                                                <th className="px-2 py-1">Test Dates</th>
                                                                <th className="px-2 py-1">Best SL/TP</th>
                                                                <th className="px-2 py-1">Test Win Rate</th>
                                                             </tr>
                                                         </thead>
                                                         <tbody>
                                                            {results.walkForwardPeriods.map((p, i) => (
                                                                <tr key={i} className="bg-zinc-900 border-b border-zinc-800">
                                                                    <td className="px-2 py-1 font-bold">{i+1}</td>
                                                                    <td className="px-2 py-1">{new Date(p.trainStart).toLocaleDateString()} - {new Date(p.trainEnd).toLocaleDateString()}</td>
                                                                    <td className="px-2 py-1">{new Date(p.testStart).toLocaleDateString()} - {new Date(p.testEnd).toLocaleDateString()}</td>
                                                                    <td className="px-2 py-1">{p.bestSl.toFixed(1)}% / {p.bestTp.toFixed(1)}%</td>
                                                                    <td className="px-2 py-1 font-bold text-cyan-400">{p.testMetrics.winRate}</td>
                                                                </tr>
                                                            ))}
                                                         </tbody>
                                                     </table>
                                                 </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'equity' && <EquityChart data={results.equityCurve} />}
                                {activeTab === 'chart' && (
                                    <TradingViewChart 
                                        key={chartKey}
                                        isLive={false}
                                        backtestConfig={config}
                                        initialData={results.candles}
                                        signals={results.signals}
                                        onSignalClick={handleSignalClick}
                                    />
                                )}
                                {activeTab === 'log' && <TradeLog trades={results.trades || []} />}
                                {activeTab === 'signal' && selectedSignal && (
                                    <SignalDetailsPanel signal={selectedSignal} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Backtesting;
