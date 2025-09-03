import React from 'react';

const SentimentGauge: React.FC = () => {
  const sentiment = 75; // Example: 75% bullish
  const rotation = (sentiment / 100) * 180 - 90;

  return (
    <div className="w-full max-w-xs mx-auto p-6 bg-gray-800 rounded-lg shadow-lg text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Market Sentiment</h3>
        <div className="relative inline-block">
            <svg width="180" height="90" viewBox="0 0 180 90">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                </defs>
                <path d="M10 90 A 80 80 0 0 1 170 90" fill="none" stroke="url(#gaugeGradient)" strokeWidth="20" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-0 left-1/2" style={{ transform: `translateX(-50%)` }}>
                <div 
                    className="w-1 h-16 bg-white rounded-full origin-bottom" 
                    style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease-in-out' }}>
                </div>
                 <div className="w-4 h-4 bg-white rounded-full absolute bottom-[-8px] left-1/2 -translate-x-1/2"></div>
            </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-green-400">Strong Bullish</div>
        <div className="flex justify-between text-xs text-gray-400 px-2 mt-1">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
        </div>
    </div>
  );
};

export default SentimentGauge;
