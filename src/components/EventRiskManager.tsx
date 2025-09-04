import React, { useState, useEffect } from 'react';
import { useBroker } from '../contexts/BrokerContext';
import type { NewsEngineStatus } from '../types';

const statusConfig: Record<NewsEngineStatus, { color: string; icon: string; text: string }> = {
    inactive: { color: 'text-zinc-500', icon: 'fa-power-off', text: 'Inactive' },
    initializing: { color: 'text-yellow-400', icon: 'fa-spinner fa-spin', text: 'Initializing...' },
    monitoring: { color: 'text-green-400', icon: 'fa-shield-halved', text: 'Monitoring' },
    safe_mode: { color: 'text-amber-400', icon: 'fa-triangle-exclamation', text: 'SAFE MODE' },
    error: { color: 'text-red-400', icon: 'fa-bomb', text: 'Error' },
};

const EventRiskManager: React.FC = () => {
    const { newsStatus, newsMessage, newsEvents, initializeNewsEngine } = useBroker();
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('alphaVantageApiKey') || '');

    useEffect(() => {
        localStorage.setItem('alphaVantageApiKey', apiKey);
    }, [apiKey]);
    
    const handleInitialize = () => {
        if (apiKey.trim()) {
            initializeNewsEngine(apiKey.trim());
        }
    };
    
    const config = statusConfig[newsStatus];

    return (
        <div className="bg-zinc-950 border border-zinc-800 p-2">
            <h3 className="text-xs font-semibold text-white mb-2 flex justify-between items-center">
                <span>Event Risk Manager</span>
                 <span className={`flex items-center gap-1.5 text-xs ${config.color}`}>
                    <i className={`fa-solid ${config.icon}`}></i>
                    <span>{config.text}</span>
                 </span>
            </h3>
            
            {newsStatus === 'inactive' || newsStatus === 'error' ? (
                 <div className="space-y-2">
                    <p className="text-[11px] text-zinc-400">{newsMessage}</p>
                    <div className="flex gap-2">
                         <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Alpha Vantage API Key"
                            className="flex-grow bg-zinc-800 border border-zinc-700 py-1 px-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none rounded-sm"
                        />
                         <button 
                            onClick={handleInitialize}
                            disabled={!apiKey.trim()}
                            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-1 px-3 text-xs rounded-sm"
                         >
                            Init
                         </button>
                    </div>
                 </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-[11px] text-zinc-400">{newsMessage}</p>
                     <div className="max-h-24 overflow-y-auto pr-1">
                        {newsEvents.length > 0 ? (
                             <ul className="text-xs text-zinc-300 space-y-1">
                                {newsEvents.map(event => (
                                    <li key={event.time} className="flex justify-between items-center bg-zinc-800/50 p-1 rounded-sm">
                                        <span>{event.event}</span>
                                        <span className="font-mono text-cyan-400 text-[10px]">{new Date(event.time).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <div className="text-center text-xs text-zinc-500 py-2">No high-impact events for today.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventRiskManager;
