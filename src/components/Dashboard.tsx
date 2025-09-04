import React from 'react';
import SignalCard from './SignalCard';
import { useBroker } from '../contexts/BrokerContext';
import TradingViewChart from './TradingViewChart';
import SentimentGauge from './SentimentGauge';

const Dashboard: React.FC = () => {
  const { 
    status: brokerStatus, 
    marketStatus, 
    signals3m, 
    signals5m, 
    signals15m, 
    isStreaming, 
    startStream, 
    stopStream 
  } = useBroker();

  const allSignals = [...signals3m, ...signals5m, ...signals15m];

  const toggleStream = () => {
    if (isStreaming) stopStream();
    else startStream();
  }

  const EmptyState = ({ timeframe }: {timeframe: string}) => (
    <div className="flex items-center justify-center h-full text-center text-zinc-600 text-xs px-2">
      {isStreaming ? (marketStatus === 'OPEN' ? `Waiting for ${timeframe} signals...` : 'Market is closed.') : 'Start feed to see signals.'}
    </div>
  );
  
  const EmptyLatestSignal = () => (
    <div className="flex items-center justify-center h-full text-center text-zinc-600 text-xs p-2">
      Waiting for signal...
    </div>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-700 flex flex-col p-2 gap-2">
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
            <button
                onClick={toggleStream}
                disabled={brokerStatus !== 'connected'}
                className={`px-3 py-1 font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-xs rounded-sm ${isStreaming ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} disabled:bg-zinc-600 disabled:cursor-not-allowed`} >
                {isStreaming ? <><i className="fas fa-stop-circle animate-pulse"></i> Stop Feed</> : <><i className="fas fa-play-circle"></i> Start Feed</>}
            </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-2">
            {/* Left Column: Chart & Signal Logs */}
            <div className="xl:col-span-3 flex flex-col gap-2">
                {/* Chart */}
                <div className="h-[55vh] min-h-[400px] bg-zinc-950 border border-zinc-800 p-2 flex flex-col">
                    <h3 className="text-xs font-semibold text-white mb-1 flex-shrink-0">BANKNIFTY Chart (Live)</h3>
                    <div className="relative flex-grow bg-zinc-900 overflow-hidden">
                       <TradingViewChart 
                         isLive={true}
                         signals={allSignals}
                       />
                    </div>
                </div>
                {/* Signal Logs */}
                <div className="bg-zinc-950 border border-zinc-800 p-2">
                    <h3 className="text-xs font-semibold text-white mb-1">Today's Signal Log</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* 3 Minute Log */}
                        <div className="bg-zinc-900 p-1 flex flex-col h-64">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1 flex-shrink-0">3 MINUTE</h4>
                            <div className="overflow-y-auto pr-1 space-y-1 flex-grow pt-1">
                                {signals3m.length > 0 ? signals3m.map((s, i) => <div key={`${s.time}-3m-${i}`} className={i === 0 ? 'animate-fade-in' : ''}><SignalCard signal={s} /></div>) : <EmptyState timeframe="3m" />}
                            </div>
                        </div>
                        {/* 5 Minute Log */}
                        <div className="bg-zinc-900 p-1 flex flex-col h-64">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1 flex-shrink-0">5 MINUTE</h4>
                            <div className="overflow-y-auto pr-1 space-y-1 flex-grow pt-1">
                                {signals5m.length > 0 ? signals5m.map((s, i) => <div key={`${s.time}-5m-${i}`} className={i === 0 ? 'animate-fade-in' : ''}><SignalCard signal={s} /></div>) : <EmptyState timeframe="5m" />}
                            </div>
                        </div>
                        {/* 15 Minute Log */}
                        <div className="bg-zinc-900 p-1 flex flex-col h-64">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1 flex-shrink-0">15 MINUTE</h4>
                            <div className="overflow-y-auto pr-1 space-y-1 flex-grow pt-1">
                                {signals15m.length > 0 ? signals15m.map((s, i) => <div key={`${s.time}-15m-${i}`} className={i === 0 ? 'animate-fade-in' : ''}><SignalCard signal={s} /></div>) : <EmptyState timeframe="15m" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Summary Panels */}
            <div className="xl:col-span-2 bg-zinc-950 border border-zinc-800 p-2 flex flex-col gap-2">
                <div className="flex-shrink-0">
                    <h3 className="text-xs font-semibold text-white mb-1">Latest Active Signals</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                        <div className="bg-zinc-900 p-1">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1">LATEST (3M)</h4>
                            <div className="p-1 min-h-[70px] flex flex-col justify-center">
                                {signals3m.length > 0 ? <SignalCard signal={signals3m[0]} /> : <EmptyLatestSignal />}
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-1">
                            <h4 className="text-center text-[10px] font-bold text-cyan-400 border-b border-zinc-800 pb-1">LATEST (5M)</h4>
                            <div className="p-1 min-h-[70px] flex flex-col justify-center">
                                {signals5m.length > 0 ? <SignalCard signal={signals5m[0]} /> : <EmptyLatestSignal />}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <h3 className="text-xs font-semibold text-white mb-1">Market Sentiment</h3>
                    <div className="bg-zinc-900">
                        <SentimentGauge />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;