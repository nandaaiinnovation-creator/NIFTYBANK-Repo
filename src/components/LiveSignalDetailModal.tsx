import React from 'react';
import { Signal, SignalDirection } from '../types';

interface LiveSignalDetailModalProps {
    signal: Signal;
    onClose: () => void;
}

const LiveSignalDetailModal: React.FC<LiveSignalDetailModalProps> = ({ signal, onClose }) => {
    const isBuy = signal.direction === SignalDirection.BUY;
    const directionColor = isBuy ? 'text-green-400' : 'text-red-400';
    const directionBg = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-zinc-800 w-full max-w-md border border-zinc-700 shadow-lg" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-3 border-b border-zinc-700">
                    <h2 className="text-lg font-semibold text-white">Live Signal Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div className="p-4 space-y-4">
                     <div className={`p-3 rounded-sm ${directionBg}`}>
                        <div className="flex justify-between items-center">
                            <span className={`font-bold text-xl ${directionColor}`}>{signal.direction}</span>
                            <span className="font-mono text-white text-xl">{signal.price.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-zinc-400 text-right">{new Date(signal.time).toLocaleString()}</div>
                    </div>

                    <div>
                        <div className="text-xs text-zinc-400">Conviction</div>
                        <div className="w-full bg-zinc-700 rounded-full h-2.5">
                            <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${signal.conviction}%` }}></div>
                        </div>
                        <div className="text-right font-bold text-white text-sm">{signal.conviction}%</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                        <div>
                            <h3 className="text-sm font-semibold text-green-400 mb-2">Rules Passed ({signal.rulesPassed.length})</h3>
                            <ul className="text-xs text-zinc-300 bg-zinc-700/50 p-2 rounded-sm space-y-1">
                                {signal.rulesPassed.map(rule => <li key={rule} className="truncate">&#x2713; {rule}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h3 className="text-sm font-semibold text-red-400 mb-2">Rules Failed ({signal.rulesFailed.length})</h3>
                            <ul className="text-xs text-zinc-400 bg-zinc-700/50 p-2 rounded-sm space-y-1">
                                {signal.rulesFailed.map(rule => <li key={rule} className="truncate">&#x2717; {rule}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveSignalDetailModal;
