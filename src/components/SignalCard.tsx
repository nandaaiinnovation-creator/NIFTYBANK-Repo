import React from 'react';
import type { Signal } from '../types';
import { SignalDirection } from '../types';

interface SignalCardProps {
  signal: Signal;
  onClick?: (signal: Signal) => void;
}

const signalConfig = {
  [SignalDirection.STRONG_BUY]: {
    label: 'STRONG BUY',
    borderColor: 'border-green-400',
    textColor: 'text-green-300',
    icon: <i className="fa-solid fa-bolt text-green-300"></i>
  },
  [SignalDirection.BUY]: {
    label: 'BUY',
    borderColor: 'border-green-600',
    textColor: 'text-green-400',
    icon: <i className="fa-solid fa-arrow-up text-green-400"></i>
  },
  [SignalDirection.STRONG_SELL]: {
    label: 'STRONG SELL',
    borderColor: 'border-red-400',
    textColor: 'text-red-300',
    icon: <i className="fa-solid fa-bolt text-red-300"></i>
  },
  [SignalDirection.SELL]: {
    label: 'SELL',
    borderColor: 'border-red-600',
    textColor: 'text-red-400',
    icon: <i className="fa-solid fa-arrow-down text-red-400"></i>
  },
  [SignalDirection.PRICE_CONSOLIDATION]: {
    label: 'CONSOLIDATION',
    borderColor: 'border-yellow-600',
    textColor: 'text-yellow-400',
    icon: <i className="fa-solid fa-compress text-yellow-400"></i>
  },
  [SignalDirection.NEUTRAL]: {
    label: 'NEUTRAL',
    borderColor: 'border-zinc-600',
    textColor: 'text-zinc-400',
    icon: <i className="fa-solid fa-minus text-zinc-400"></i>
  },
};

const SignalCard: React.FC<SignalCardProps> = ({ signal, onClick }) => {
  const config = signalConfig[signal.direction] || signalConfig[SignalDirection.NEUTRAL];
  const isNewsEvent = !!signal.triggeredDuringEvent;
  
  const time = new Date(signal.time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const handleCardClick = () => {
    if (onClick) {
      onClick(signal);
    }
  };

  const isInfoSignal = signal.direction === SignalDirection.PRICE_CONSOLIDATION;
  const borderColor = isNewsEvent ? 'border-amber-500' : config.borderColor;

  return (
    <div 
        className={`w-full bg-zinc-900 border-l-4 ${borderColor} p-1 transition-colors ${onClick ? 'cursor-pointer hover:bg-zinc-800' : ''}`}
        onClick={handleCardClick}
        title={isNewsEvent ? `Triggered during: ${signal.triggeredDuringEvent}` : ''}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="text-xs font-bold text-white">{signal.symbol}</div>
            <div className="text-[10px] font-mono bg-zinc-700 text-cyan-300 px-1 py-0.5 rounded-sm">{signal.timeframe}</div>
            {isNewsEvent && <i className="fa-solid fa-newspaper text-amber-400 text-xs"></i>}
          </div>
          <div className="text-[10px] text-zinc-400">{time}</div>
        </div>
        <div className={`text-sm font-bold ${config.textColor} flex items-center gap-1.5`}>
            {config.icon}
            <span>{config.label} {!isInfoSignal && `@ ${signal.price}`}</span>
        </div>
      </div>
      {!isInfoSignal && (
         <div className="text-xs font-medium text-zinc-300 mt-0.5">
            Conviction: <span className="font-bold text-white">{signal.conviction}%</span>
        </div>
      )}
    </div>
  );
};

export default SignalCard;
