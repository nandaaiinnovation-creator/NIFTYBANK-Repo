import React, { useState } from 'react';
import SignalCard from './SignalCard';
import { SignalDirection } from '../types';
import type { SignalPerformance } from '../types';
import { runSignalAnalysis } from '../services/api';

const originalSignal = {
  time: "11:32 AM",
  symbol: "BANKNIFTY",
  price: 54120,
  direction: SignalDirection.BUY,
  rulesPassed: ["Market Structure", "Volume Analysis", "IB Breakout"],
  rulesFailed: ["Component Divergence", "Momentum"],
  conviction: 68,
  timeframe: '5m',
};
const mlEnhancedSignal = { ...originalSignal, conviction: 82 };

// --- SMART SIGNALS (MOCKUP) ---
const SmartSignalsContent: React.FC = () => {
    const [mlEnabled, setMlEnabled] = useState(true);
    return (
        <div className="bg-zinc-950 border border-zinc-800 p-3">
            <div className="flex justify-center mb-3">
                <div className="flex items-center gap-3 bg-zinc-900 p-1.5 border border-zinc-800 rounded-sm">
                    <span className={`text-xs font-semibold ${mlEnabled ? 'text-cyan-400' : 'text-gray-500'}`}>ML Enhancement</span>
                    <label htmlFor="ml-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input id="ml-toggle" type="checkbox" className="sr-only" checked={mlEnabled} onChange={() => setMlEnabled(!mlEnabled)} />
                            <div className={`block w-10 h-5 rounded-full transition-colors ${mlEnabled ? 'bg-cyan-500' : 'bg-zinc-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${mlEnabled ? 'transform translate-x-5' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </div>
            <p className="text-zinc-400 mb-3 leading-relaxed text-center max-w-3xl mx-auto text-xs">
                The ML model acts as an intelligent filter, learning from historical data to identify subtle patterns and adjust the conviction score based on deeper analysis.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <div className="w-full md:w-auto text-center">
                    <p className="font-semibold text-gray-300 mb-2 text-xs">Rule-Based Signal</p>
                    <SignalCard signal={originalSignal} />
                </div>
                <div className="text-cyan-400 text-2xl hidden md:block"> <i className="fas fa-arrow-right-long"></i> </div>
                <div className="text-cyan-400 text-2xl md:hidden"> <i className="fas fa-arrow-down-long"></i> </div>
                <div className="w-full md:w-auto text-center">
                    <p className="font-semibold text-cyan-300 mb-2 flex items-center justify-center gap-2 text-xs"> <i className="fa-solid fa-brain"></i> ML Enhanced Signal </p>
                    <SignalCard signal={mlEnabled ? mlEnhancedSignal : originalSignal} />
                </div>
            </div>
        </div>
    );
};

// --- PREDICTIVE FORECASTS (MOCKUP) ---
const PredictiveForecastsContent: React.FC = () => (
    <div className="bg-zinc-950 border border-zinc-800 p-3">
         <p className="text-zinc-400 mb-3 leading-relaxed text-center max-w-3xl mx-auto text-xs">
            This advanced model proactively forecasts future market behavior, predicting high-probability breakout zones and periods of increased volatility before they happen.
        </p>
        <h3 className="text-sm font-semibold text-center text-white mb-1">Market Forecast Mockup</h3>
        <div className="bg-zinc-900 p-2 max-w-2xl mx-auto border border-zinc-800">
          <div className="relative h-48 bg-zinc-950 p-2 flex items-end">
            <div className="flex items-end h-full gap-1">
                <div className="w-3 h-10 bg-red-500"></div> <div className="w-3 h-14 bg-red-500"></div>
                <div className="w-3 h-8 bg-green-500"></div> <div className="w-3 h-20 bg-green-500"></div>
            </div>
            <div className="absolute top-1/4 right-0 h-1/2 w-1/3 bg-cyan-500/10 border-l-2 border-cyan-500 border-dashed flex items-center justify-center">
               <div className="text-center p-2"><p className="text-cyan-300 font-semibold text-xs">Predicted Breakout Zone</p></div>
            </div>
             <p className="absolute bottom-1 left-2 text-xs text-zinc-500">Past Price Action</p>
             <p className="absolute bottom-1 right-2 text-xs text-zinc-500">Future Forecast</p>
          </div>
        </div>
    </div>
);

// --- PERFORMANCE ANALYSIS (FUNCTIONAL) ---
const PerformanceAnalysisContent: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SignalPerformance | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRunAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setResults(null);
        try {
            const data = await runSignalAnalysis();
            setResults(data);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-zinc-950 border border-zinc-800 p-3">
            <p className="text-zinc-400 mb-3 leading-relaxed text-center max-w-3xl mx-auto text-xs">
                This tool analyzes the performance of all signals from the last 24 hours. It validates each signal against subsequent price action to determine its profitability, providing a clear feedback loop on your rule configuration's effectiveness.
            </p>
            <div className="text-center mb-3">
                <button 
                    onClick={handleRunAnalysis} 
                    disabled={isLoading}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 text-white font-bold py-1.5 px-4 text-xs rounded-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fas fa-play"></i> Run Analysis</>}
                </button>
            </div>

            {isLoading && (
                 <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                    <i className="fas fa-chart-line text-3xl mb-3 animate-pulse"></i>
                    <p className="text-sm">Processing Recent Signals...</p>
                 </div>
            )}
            
            {error && (
                <div className="text-center text-red-400 bg-red-900/20 border border-red-500 p-2 text-xs">{error}</div>
            )}

            {results && (
                <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                        <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Total Signals</div><div className="text-lg font-bold text-white">{results.totalSignals}</div></div>
                        <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Wins</div><div className="text-lg font-bold text-green-400">{results.wins}</div></div>
                        <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Losses</div><div className="text-lg font-bold text-red-400">{results.losses}</div></div>
                        <div className="bg-zinc-900 p-2 border border-zinc-800 rounded-sm"><div className="text-xs text-gray-400">Win Rate</div><div className="text-lg font-bold text-cyan-400">{results.winRate}</div></div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white text-center text-sm mb-2">Rule Performance Breakdown</h4>
                        <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-xs text-left text-zinc-400">
                                <thead className="text-xs text-zinc-300 uppercase bg-zinc-800 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-3 py-1.5">Rule Name</th>
                                        <th scope="col" className="px-3 py-1.5 text-center">Wins</th>
                                        <th scope="col" className="px-3 py-1.5 text-center">Losses</th>
                                        <th scope="col" className="px-3 py-1.5 text-center">Win Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.rulePerformance.map(rule => (
                                        <tr key={rule.rule} className="bg-zinc-900 border-b border-zinc-800">
                                            <th scope="row" className="px-3 py-1.5 font-medium text-white whitespace-nowrap">{rule.rule}</th>
                                            <td className="px-3 py-1.5 text-center text-green-400">{rule.wins}</td>
                                            <td className="px-3 py-1.5 text-center text-red-400">{rule.losses}</td>
                                            <td className="px-3 py-1.5 text-center font-bold text-cyan-400">{rule.winRate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MLIntelligence: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'analysis' | 'smart' | 'predictive'>('analysis');
    
    const TabButton: React.FC<{ tabName: 'analysis' | 'smart' | 'predictive', children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-2 py-1 font-medium text-xs border-b-2 transition-colors ${activeTab === tabName ? 'text-cyan-400 border-cyan-400' : 'text-zinc-400 border-transparent hover:text-white'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-zinc-900 border border-zinc-700 h-full flex flex-col p-2 gap-2">
             <div className="flex items-center flex-shrink-0">
                <i className="fa-solid fa-brain text-md text-cyan-400 mr-2"></i>
                <h2 className="text-md font-semibold text-white">ML Intelligence & Feedback</h2>
            </div>
            <div className="border-b border-zinc-800 flex-shrink-0">
                <nav className="-mb-px flex gap-2" aria-label="Tabs">
                    <TabButton tabName="analysis"><i className="fas fa-chart-pie mr-1.5"></i>Performance Analysis</TabButton>
                    <TabButton tabName="smart"><i className="fas fa-lightbulb mr-1.5"></i>Smart Signals (Mockup)</TabButton>
                    <TabButton tabName="predictive"><i className="fas fa-wand-magic-sparkles mr-1.5"></i>Predictive Forecasts (Mockup)</TabButton>
                </nav>
            </div>
            <div className="mt-1 flex-grow overflow-y-auto">
                {activeTab === 'analysis' && <PerformanceAnalysisContent />}
                {activeTab === 'smart' && <SmartSignalsContent />}
                {activeTab === 'predictive' && <PredictiveForecastsContent />}
            </div>
        </div>
    );
};

export default MLIntelligence;