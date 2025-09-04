import React from 'react';
import type { Signal } from '../types';
import { SignalDirection } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isBuy = signal.direction === SignalDirection.BUY;
  const cardColor = isBuy ? 'border-green-500/80' : 'border-red-500/80';
  const directionColor = isBuy ? 'text-green-400' : 'text-red-400';
  
  const time = new Date(signal.time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className={`w-full bg-zinc-900 border-l-4 ${cardColor} p-1`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-bold text-white">{signal.symbol}</div>
            <div className="text-[10px] font-mono bg-zinc-700 text-cyan-300 px-1 py-0.5 rounded-sm">{signal.timeframe}</div>
          </div>
          <div className="text-[10px] text-zinc-400">{time}</div>
        </div>
        <div className={`text-sm font-bold ${directionColor}`}>{signal.direction} @ {signal.price}</div>
      </div>
       <div className="text-xs font-medium text-zinc-300 mt-0.5">
        Conviction: <span className="font-bold text-white">{signal.conviction}%</span>
      </div>
    </div>
  );
};

export default SignalCard;