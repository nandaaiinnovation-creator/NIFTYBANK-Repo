import React from 'react';
import SectionCard from './SectionCard';
import SignalCard from './SignalCard';
import { SignalDirection } from '../types';

const originalSignal = {
  time: "11:32 AM",
  symbol: "BANKNIFTY",
  price: 54120,
  direction: SignalDirection.BUY,
  rulesPassed: ["Market Structure", "Volume Analysis", "IB Breakout"],
  rulesFailed: ["Component Divergence", "Momentum"],
  conviction: 68,
};

const mlEnhancedSignal = {
  ...originalSignal,
  conviction: 82,
};


const MLIntegration: React.FC = () => {
  return (
    <SectionCard title="ML Smart Signals" iconClass="fa-solid fa-brain">
      <p className="text-gray-400 mb-6 leading-relaxed">
        By integrating a Machine Learning model, the system can move beyond a rule-based conviction score. The ML model learns from historical data, identifying subtle patterns and correlations that lead to high-probability trades. It acts as a final, intelligent filter, adjusting the conviction percentage based on this deeper analysis.
      </p>
      
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-center text-white mb-2">Conviction Score Enhancement</h3>
        <p className="text-sm text-gray-500 text-center mb-6">The ML model adjusts the initial conviction score based on historical pattern matching.</p>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          
          {/* Original Signal */}
          <div className="w-full md:w-auto text-center">
            <p className="font-semibold text-gray-300 mb-2">Rule-Based Signal</p>
            <SignalCard signal={originalSignal} />
          </div>

          <div className="text-cyan-400 text-4xl hidden md:block">
            <i className="fas fa-arrow-right-long"></i>
          </div>
           <div className="text-cyan-400 text-4xl md:hidden">
            <i className="fas fa-arrow-down-long"></i>
          </div>

          {/* ML Enhanced Signal */}
           <div className="w-full md:w-auto text-center">
            <p className="font-semibold text-cyan-300 mb-2 flex items-center justify-center gap-2">
              <i className="fa-solid fa-brain"></i> ML Enhanced Signal
            </p>
            <SignalCard signal={mlEnhancedSignal} />
          </div>
        </div>
         <p className="text-xs text-gray-500 text-center mt-6">
            In this example, the ML model identified a historical pattern similar to the current market condition that has an 82% success rate, thus boosting the conviction from 68% to 82%.
        </p>
      </div>

    </SectionCard>
  );
};

export default MLIntegration;
