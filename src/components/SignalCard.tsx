import React from 'react';
import type { Signal } from '../types';
import { SignalDirection } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const getSignalStrength = (conviction: number, direction: SignalDirection): { text: string; color: string } => {
    if (direction === SignalDirection.BUY) {
        if (conviction > 85) return { text: 'Strong Buy', color: 'bg-green-600' };
        if (conviction > 65) return { text: 'Buy', color: 'bg-green-500' };
    }
    if (direction === SignalDirection.SELL) {
        if (conviction > 85) return { text: 'Strong Sell', color: 'bg-red-600' };
        if (conviction > 65) return { text: 'Sell', color: 'bg-red-500' };
    }
    if (conviction < 40) return { text: 'Consolidation', color: 'bg-yellow-600' };
    
    return { text: 'Neutral', color: 'bg-zinc-600' };
};

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isBuy = signal.direction === SignalDirection.BUY;
  const cardColor = isBuy ? 'border-green-500' : 'border-red-500';
  const directionColor = isBuy ? 'text-green-400' : 'text-red-400';
  const strength = getSignalStrength(signal.conviction, signal.direction);

  return (
    <div className={`w-full bg-zinc-800 border-l-4 ${cardColor} p-3`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-white">{signal.symbol}</div>
            <div className="text-xs font-mono bg-zinc-700 text-cyan-300 px-1.5 py-0.5">{signal.timeframe}</div>
          </div>
          <div className="text-xs text-gray-400">{signal.time}</div>
        </div>
        <div className={`text-xl font-bold ${directionColor}`}>{signal.direction} @ {signal.price}</div>
      </div>
      
       <div className="flex justify-between items-center my-3">
          <div className="text-sm font-medium text-gray-300">
            Strength: <span className="font-bold text-white">{signal.conviction}%</span>
          </div>
          <span className={`text-xs font-bold text-white px-2 py-1 ${strength.color}`}>
            {strength.text}
          </span>
        </div>
      
      <div>
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-green-400 flex items-center"><i className="fas fa-check-circle mr-2"></i>Rules Passed</h4>
          <p className="text-xs text-gray-400">{signal.rulesPassed.join(', ')}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 flex items-center"><i className="fas fa-times-circle mr-2"></i>Rules Failed</h4>
          <p className="text-xs text-gray-400">{signal.rulesFailed.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;