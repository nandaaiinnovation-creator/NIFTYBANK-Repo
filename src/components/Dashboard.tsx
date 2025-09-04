import React, { useState } from 'react';
import SignalCard from './SignalCard';
import { useBroker } from '../contexts/BrokerContext';
import TradingViewChart from './TradingViewChart';
import SentimentGauge from './SentimentGauge';
import LiveSignalDetailModal from './LiveSignalDetailModal';
import EventRiskManager from './EventRiskManager'; // Import the new component
import type { Signal } from '../types';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: () => void; disabled?: boolean }> = ({ label, enabled, onToggle, disabled }) => (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
        <span className={`text-xs font-semibold ${disabled ? 'text-zinc-600' : (enabled ? 'text-cyan-400' : 'text-zinc-400')}`}>{label}</span>
        <label className={`flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={enabled} onChange={onToggle} disabled={disabled} />
                <div className={`block w-9 h-5 rounded-full transition-colors ${disabled ? 'bg-zinc-700' : (enabled ? 'bg-cyan-600' : 'bg-zinc-600')}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
            </div>
        </label>
    </div>
);

const MarketVitalsPanel: React.FC = () => {
    const { marketVitals } = useBroker();
    const Vital: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <div className="flex justify-between items-baseline text-xs">
            <span className="text-zinc-400">{label}</span>
            <span className="font-mono font-semibold text-white">{value}</span>
        </div>
    );
    return (
        <div className="bg-zinc-950 border border-zinc-800 p-2">
            <h3 className="text-xs font-semibold text-white mb-2">Market Vitals</h3>
            <div className="space-y-1.5">
                <Vital label="Open" value={marketVitals?.open.toFixed(2) || '...'} />
                <Vital label="High" value={marketVitals?.high.toFixed(2) || '...'} />
                <Vital label="Low" value={marketVitals?.low.toFixed(2) || '...'} />
                <Vital label="India VIX" value={marketVitals?.vix.toFixed(2) || '...'} />
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
  const { 
    status: brokerStatus, 
    marketStatus, 
    signals3m, 
    signals5m, 
    signals15m,
    sentiment,
    isChartLive,
    isSignalFeedActive,
    toggleChartLive,
    toggleSignalFeedActive,
  } = useBroker();
  
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const allSignals = [...signals3m, ...signals5m, ...signals15m];

  const EmptyState = ({ timeframe }: {timeframe: string}) => (
    <div className="flex items-center justify-center h-full text-center text-zinc-600 text-xs px-2">
      {isSignalFeedActive ? (marketStatus === 'OPEN' ? `Waiting for ${timeframe} signals...` : 'Market is closed.') : 'Start Signal Feed.'}
    </div>
  );
  
  return (
    <div className="bg-zinc-900 border border-zinc-700 h-full flex flex-col p-2 gap-2">
        {selectedSignal && <LiveSignalDetailModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}
        
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
                 <div className="flex items-center">
                    <i className="fa-solid fa-desktop text-md text-cyan-400 mr-2"></i>
                    <h2 className="text-md font-semibold text-white">Live Dashboard</h2>
                </div>
                 <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white hidden md:block">Market:</h3>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${marketStatus === 'OPEN' ? 'bg-green-600/50 text-green-300' : 'bg-red-600/50 text-red-300'}`}>
                        {marketStatus}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <ToggleSwitch label="Live Chart" enabled={isChartLive} onToggle={toggleChartLive} disabled={brokerStatus !== 'connected'} />
                <ToggleSwitch label="Signal Feed" enabled={isSignalFeedActive} onToggle={toggleSignalFeedActive} disabled={brokerStatus !== 'connected'} />
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-2 flex-grow min-h-0">
            {/* Left Column: Chart */}
            <div className="lg:w-3/5 flex-grow flex flex-col bg-zinc-950 border border-zinc-800 p-2 min-h-[400px]">
                <h3 className="text-xs font-semibold text-white mb-1 flex-shrink-0">BANKNIFTY Chart</h3>
                <div className="relative flex-grow bg-zinc-900 overflow-hidden">
                   <TradingViewChart 
                     isLive={true}
                     signals={allSignals}
                   />
                </div>
            </div>

            {/* Right Column: Summary & Logs */}
            <div className="lg:w-2/5 flex flex-col gap-2">
                 {/* Summary Panel */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-shrink-0">
                     <div className="bg-zinc-950 border border-zinc-800 p-2">
                        <h3 className="text-xs font-semibold text-white mb-1">Latest Active Signals</h3>
                         <div className="flex flex-col gap-1">
                            {signals3m.length > 0 ? <SignalCard signal={signals3m[0]} onClick={setSelectedSignal} /> : <div className="p-1 text-xs text-zinc-600 text-center">No 3m signal</div>}
                            {signals5m.length > 0 ? <SignalCard signal={signals5m[0]} onClick={setSelectedSignal} /> : <div className="p-1 text-xs text-zinc-600 text-center">No 5m signal</div>}
                            {signals15m.length > 0 ? <SignalCard signal={signals15m[0]} onClick={setSelectedSignal} /> : <div className="p-1 text-xs text-zinc-600 text-center">No 15m signal</div>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <EventRiskManager />
                        <MarketVitalsPanel />
                        <div className="bg-zinc-950 border border-zinc-800 p-2">
                            <h3 className="text-xs font-semibold text-white mb-1">Market Sentiment</h3>
                            <div className="h-full min-h-[70px]">
                                <SentimentGauge sentiment={sentiment} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signal Logs Panel */}
                <div className="bg-zinc-950 border border-zinc-800 p-2 flex-grow flex flex-col min-h-[400px]">
                    <h3 className="text-xs font-semibold text-white mb-1 flex-shrink-0">Today's Signal Log</h3>
                    <div className="flex flex-col sm:flex-row gap-2 flex-grow min-h-0">
                        {/* 3 Minute Log */}
                        <div className="bg-zinc-900 p-1 flex flex-col flex-1 min-h-0">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1 flex-shrink-0">3 MINUTE</h4>
                            <div className="overflow-y-auto pr-1 space-y-1 flex-grow pt-1">
                                {signals3m.length > 0 ? signals3m.map((s, i) => <SignalCard key={`${s.time}-3m-${i}`} signal={s} onClick={setSelectedSignal} />) : <EmptyState timeframe="3m" />}
                            </div>
                        </div>
                        {/* 5 Minute Log */}
                        <div className="bg-zinc-900 p-1 flex flex-col flex-1 min-h-0">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1 flex-shrink-0">5 MINUTE</h4>
                            <div className="overflow-y-auto pr-1 space-y-1 flex-grow pt-1">
                                {signals5m.length > 0 ? signals5m.map((s, i) => <SignalCard key={`${s.time}-5m-${i}`} signal={s} onClick={setSelectedSignal} />) : <EmptyState timeframe="5m" />}
                            </div>
                        </div>
                        {/* 15 Minute Log */}
                        <div className="bg-zinc-900 p-1 flex flex-col flex-1 min-h-0">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1 flex-shrink-0">15 MINUTE</h4>
                            <div className="overflow-y-auto pr-1 space-y-1 flex-grow pt-1">
                                {signals15m.length > 0 ? signals15m.map((s, i) => <SignalCard key={`${s.time}-15m-${i}`} signal={s} onClick={setSelectedSignal} />) : <EmptyState timeframe="15m" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;