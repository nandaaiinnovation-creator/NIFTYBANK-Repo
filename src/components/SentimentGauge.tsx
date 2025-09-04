import React from 'react';

interface SentimentGaugeProps {
  sentiment: number; // A score from 0 (bearish) to 100 (bullish)
}

const SentimentGauge: React.FC<SentimentGaugeProps> = ({ sentiment }) => {
  const rotation = (sentiment / 100) * 180 - 90;

  let sentimentText = 'Neutral';
  let textColor = 'text-amber-400';

  if (sentiment > 80) { 
      sentimentText = 'Strong Bullish'; 
      textColor = 'text-green-400'; 
  } else if (sentiment > 60) { 
      sentimentText = 'Bullish'; 
      textColor = 'text-green-500'; 
  } else if (sentiment < 20) { 
      sentimentText = 'Strong Bearish'; 
      textColor = 'text-red-400'; 
  } else if (sentiment < 40) { 
      sentimentText = 'Bearish'; 
      textColor = 'text-red-500'; 
  }

  return (
    <div className="w-full h-full p-1 bg-zinc-900 text-center flex flex-col justify-center">
        <div className="relative inline-block mx-auto">
            <svg width="100" height="50" viewBox="0 0 100 50">
                <defs>
                    <linearGradient id="gaugeGradientCompact" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                </defs>
                <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gaugeGradientCompact)" strokeWidth="10" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-0 left-1/2" style={{ transform: `translateX(-50%)` }}>
                <div 
                    className="w-0.5 h-8 bg-white rounded-full origin-bottom" 
                    style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease-in-out' }}>
                </div>
                 <div className="w-2 h-2 bg-white rounded-full absolute bottom-[-4px] left-1/2 -translate-x-1/2"></div>
            </div>
        </div>
        <div className={`text-xs font-bold ${textColor}`}>{sentimentText}</div>
        <div className="flex justify-between text-[10px] text-zinc-500 px-1">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
        </div>
    </div>
  );
};

export default SentimentGauge;