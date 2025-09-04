import React, { useState } from 'react';
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
  timeframe: '5m',
};
const mlEnhancedSignal = { ...originalSignal, conviction: 82 };

const SmartSignalsContent: React.FC = () => (
    <div className="bg-zinc-900/50 border border-zinc-700 p-3">
      <p className="text-gray-400 mb-3 leading-relaxed text-center max-w-3xl mx-auto text-sm">
        The ML model acts as an intelligent filter, learning from historical data to identify subtle patterns and adjust the conviction score based on deeper analysis.
      </p>
      
        <h3 className="text-md font-semibold text-center text-white mb-1">Conviction Score Enhancement</h3>
        <p className="text-xs text-gray-500 text-center mb-3">The ML model adjusts the initial score based on historical pattern matching.</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          
          <div className="w-full md:w-auto text-center">
            <p className="font-semibold text-gray-300 mb-2 text-sm">Rule-Based Signal</p>
            <SignalCard signal={originalSignal} />
          </div>

          <div className="text-cyan-400 text-3xl hidden md:block"> <i className="fas fa-arrow-right-long"></i> </div>
          <div className="text-cyan-400 text-3xl md:hidden"> <i className="fas fa-arrow-down-long"></i> </div>

          <div className="w-full md:w-auto text-center">
            <p className="font-semibold text-cyan-300 mb-2 flex items-center justify-center gap-2 text-sm"> <i className="fa-solid fa-brain"></i> ML Enhanced Signal </p>
            <SignalCard signal={mlEnhancedSignal} />
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
            Here, the model identified a pattern with an 82% historical success rate, boosting conviction from 68% to 82%.
        </p>
    </div>
);

const PredictiveForecastsContent: React.FC = () => (
    <div className="bg-zinc-900/50 border border-zinc-700 p-3">
         <p className="text-gray-400 mb-3 leading-relaxed text-center max-w-3xl mx-auto text-sm">
            This advanced model proactively forecasts future market behavior, predicting high-probability breakout zones and periods of increased volatility before they happen.
        </p>

        <h3 className="text-md font-semibold text-center text-white mb-1">Market Forecast Mockup</h3>
        <p className="text-xs text-gray-500 text-center mb-3">The model provides a visual forecast on the price chart.</p>
        
        <div className="bg-zinc-800 p-2 max-w-2xl mx-auto border border-zinc-700">
          <div className="flex items-center mb-2">
            <span className="text-white font-bold text-md">BANKNIFTY</span>
            <span className="text-gray-400 text-xs ml-2">5 min Chart</span>
          </div>

          <div className="relative h-56 bg-zinc-900 p-2 flex items-end">
            <div className="flex items-end h-full gap-1">
                <div className="w-3 h-10 bg-red-500"></div> <div className="w-3 h-14 bg-red-500"></div>
                <div className="w-3 h-8 bg-green-500"></div> <div className="w-3 h-20 bg-green-500"></div>
                <div className="w-3 h-16 bg-red-500"></div> <div className="w-3 h-28 bg-green-500"></div>
            </div>
            <div className="absolute top-1/4 right-0 h-1/2 w-1/3 bg-cyan-500/10 border-l-2 border-cyan-500 border-dashed flex items-center justify-center">
               <div className="text-center p-2">
                 <p className="text-cyan-300 font-semibold text-xs">Predicted Breakout Zone</p>
                 <p className="text-cyan-400 text-xs">(High Probability)</p>
               </div>
            </div>
             <p className="absolute bottom-1 left-2 text-xs text-gray-500">Past Price Action</p>
             <p className="absolute bottom-1 right-2 text-xs text-gray-500">Future Forecast</p>
          </div>
        </div>
         <p className="text-xs text-gray-500 text-center mt-3 max-w-2xl mx-auto">
            This predictive approach allows traders to anticipate market moves and position themselves strategically.
        </p>
    </div>
);

const FeedbackLoopContent: React.FC = () => (
    <div className="bg-zinc-900/50 border border-zinc-700 p-4">
        <p className="text-gray-400 mb-4 leading-relaxed text-center max-w-3xl mx-auto text-sm">
            The key to a truly intelligent system is its ability to learn and improve. The Backtesting Engine is not just for validation; it's the primary source of training data for our ML models, creating a powerful feedback loop.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="bg-zinc-800 p-3 border border-zinc-700 w-64">
                <i className="fas fa-backward-fast text-3xl text-cyan-400 mb-2"></i>
                <h4 className="font-semibold text-white text-md">1. Run Backtests</h4>
                <p className="text-xs text-gray-400 mt-1">Run extensive tests on historical data. This generates a log of every signal and the market conditions (candles, indicators) at that time.</p>
            </div>
            <div className="text-cyan-400 text-3xl transform rotate-90 md:rotate-0"><i className="fas fa-arrow-right-long"></i></div>
            <div className="bg-zinc-800 p-3 border border-zinc-700 w-64">
                <i className="fas fa-file-csv text-3xl text-green-400 mb-2"></i>
                <h4 className="font-semibold text-white text-md">2. Create Labeled Dataset</h4>
                <p className="text-xs text-gray-400 mt-1">The signal log is exported. Each signal is a "label" (BUY/SELL) attached to the "features" (the market data). We can also label if the signal was profitable or not.</p>
            </div>
             <div className="text-cyan-400 text-3xl transform rotate-90 md:rotate-0"><i className="fas fa-arrow-right-long"></i></div>
            <div className="bg-zinc-800 p-3 border border-zinc-700 w-64">
                <i className="fas fa-brain text-3xl text-orange-400 mb-2"></i>
                <h4 className="font-semibold text-white text-md">3. Train ML Model</h4>
                <p className="text-xs text-gray-400 mt-1">This high-quality dataset is used to train (or retrain) the ML models. The models learn the most subtle and profitable patterns from the historical data.</p>
            </div>
        </div>
         <p className="text-xs text-gray-500 text-center mt-4">
            This continuous cycle ensures the ML models adapt and improve over time, leading to smarter, more reliable signals in the live engine.
        </p>
    </div>
);


const MLIntelligence: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'smart' | 'predictive' | 'feedback'>('smart');
    
    const TabButton: React.FC<{ tabName: 'smart' | 'predictive' | 'feedback', children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-3 py-1.5 font-medium text-xs border-b-2 transition-colors ${activeTab === tabName ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-white'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="bg-zinc-800 p-2 border border-zinc-700">
             <div className="flex items-center mb-2">
                <i className="fa-solid fa-brain text-lg text-cyan-400 mr-3"></i>
                <h2 className="text-lg font-semibold text-white">ML Intelligence</h2>
            </div>
            <div className="border-b border-zinc-700">
                <nav className="-mb-px flex gap-2" aria-label="Tabs">
                    <TabButton tabName="smart"><i className="fas fa-lightbulb mr-1.5"></i>Smart Signals</TabButton>
                    <TabButton tabName="predictive"><i className="fas fa-wand-magic-sparkles mr-1.5"></i>Predictive Forecasts</TabButton>
                    <TabButton tabName="feedback"><i className="fas fa-sync-alt mr-1.5"></i>Feedback Loop</TabButton>
                </nav>
            </div>
            <div className="mt-3">
                {activeTab === 'smart' && <SmartSignalsContent />}
                {activeTab === 'predictive' && <PredictiveForecastsContent />}
                {activeTab === 'feedback' && <FeedbackLoopContent />}
            </div>
        </div>
    );
};

export default MLIntelligence;