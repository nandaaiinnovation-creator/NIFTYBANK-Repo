import React from 'react';
import type { Signal } from '../types';
import { SignalDirection } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isBuy = signal.direction === SignalDirection.BUY;
  const cardColor = isBuy ? 'border-green-500' : 'border-red-500';
  const directionColor = isBuy ? 'text-green-400' : 'text-red-400';
  const convictionBg = isBuy ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`w-full max-w-sm bg-gray-800 rounded-lg shadow-lg border-l-4 ${cardColor} p-5`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-gray-400">{signal.time}</div>
          <div className="text-lg font-bold text-white">{signal.symbol}</div>
        </div>
        <div className={`text-2xl font-bold ${directionColor}`}>{signal.direction} @ {signal.price}</div>
      </div>
      
      <div className="my-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-300">Conviction</span>
          <span className={`text-sm font-bold ${directionColor}`}>{signal.conviction}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className={`${convictionBg} h-2.5 rounded-full`} style={{ width: `${signal.conviction}%` }}></div>
        </div>
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
