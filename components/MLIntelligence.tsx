import React, { useState } from 'react';
import SectionCard from './SectionCard';
import SignalCard from './SignalCard';
import { SignalDirection } from '../types';

// --- CONTENT FROM MLINTEGRATION ---
const originalSignal = {
  time: "11:32 AM",
  symbol: "BANKNIFTY",
  price: 54120,
  direction: SignalDirection.BUY,
  rulesPassed: ["Market Structure", "Volume Analysis", "IB Breakout"],
  rulesFailed: ["Component Divergence", "Momentum"],
  conviction: 68,
};
const mlEnhancedSignal = { ...originalSignal, conviction: 82 };

const SmartSignalsContent: React.FC = () => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <p className="text-gray-400 mb-6 leading-relaxed text-center max-w-3xl mx-auto">
        By integrating a Machine Learning model, the system can move beyond a rule-based conviction score. The ML model learns from historical data, identifying subtle patterns and correlations that lead to high-probability trades. It acts as a final, intelligent filter, adjusting the conviction percentage based on this deeper analysis.
      </p>
      
        <h3 className="text-lg font-semibold text-center text-white mb-2">Conviction Score Enhancement</h3>
        <p className="text-sm text-gray-500 text-center mb-6">The ML model adjusts the initial conviction score based on historical pattern matching.</p>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          
          <div className="w-full md:w-auto text-center">
            <p className="font-semibold text-gray-300 mb-2">Rule-Based Signal</p>
            <SignalCard signal={originalSignal} />
          </div>

          <div className="text-cyan-400 text-4xl hidden md:block"> <i className="fas fa-arrow-right-long"></i> </div>
          <div className="text-cyan-400 text-4xl md:hidden"> <i className="fas fa-arrow-down-long"></i> </div>

          <div className="w-full md:w-auto text-center">
            <p className="font-semibold text-cyan-300 mb-2 flex items-center justify-center gap-2"> <i className="fa-solid fa-brain"></i> ML Enhanced Signal </p>
            <SignalCard signal={mlEnhancedSignal} />
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-6">
            In this example, the ML model identified a historical pattern similar to the current market condition that has an 82% success rate, thus boosting the conviction from 68% to 82%.
        </p>
    </div>
);


// --- CONTENT FROM PREDICTIVEML ---
const PredictiveForecastsContent: React.FC = () => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
         <p className="text-gray-400 mb-6 leading-relaxed text-center max-w-3xl mx-auto">
            This represents the next evolution of the ML integration. Instead of only adjusting conviction scores, this advanced model proactively forecasts future market behavior. It analyzes historical data to predict high-probability breakout zones and periods of increased volatility before they happen.
        </p>

        <h3 className="text-lg font-semibold text-center text-white mb-2">Market Forecast Mockup</h3>
        <p className="text-sm text-gray-500 text-center mb-6">The model provides a visual forecast on the price chart.</p>
        
        <div className="bg-gray-800 p-4 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center mb-4">
            <span className="text-white font-bold text-lg">BANKNIFTY</span>
            <span className="text-gray-400 text-sm ml-2">5 min Chart</span>
          </div>

          <div className="relative h-64 bg-gray-900/50 rounded-md p-2 flex items-end">
            <div className="flex items-end h-full gap-1">
                <div className="w-4 h-12 bg-red-500 rounded-sm"></div> <div className="w-4 h-16 bg-red-500 rounded-sm"></div>
                <div className="w-4 h-10 bg-green-500 rounded-sm"></div> <div className="w-4 h-24 bg-green-500 rounded-sm"></div>
                <div className="w-4 h-20 bg-red-500 rounded-sm"></div> <div className="w-4 h-32 bg-green-500 rounded-sm"></div>
            </div>
            <div className="absolute top-1/4 right-0 h-1/2 w-1/3 bg-cyan-500/10 border-l-2 border-cyan-500 border-dashed rounded-l-lg flex items-center justify-center">
               <div className="text-center p-2">
                 <p className="text-cyan-300 font-semibold text-sm">Predicted Breakout Zone</p>
                 <p className="text-cyan-400 text-xs">(High Probability)</p>
               </div>
            </div>
             <p className="absolute bottom-2 left-2 text-xs text-gray-500">Past Price Action</p>
             <p className="absolute bottom-2 right-2 text-xs text-gray-500">Future Forecast</p>
          </div>

           <div className="mt-4">
             <h4 className="text-sm font-semibold text-white mb-2 text-center">Upcoming Volatility Forecast</h4>
             <div className="flex justify-around items-end h-20 bg-gray-900/50 rounded-md p-2">
                <div className="text-center w-1/4"><div className="h-6 bg-yellow-500/50 rounded-t-sm mx-auto w-1/2"></div><p className="text-xs text-gray-400 mt-1">Low</p></div>
                <div className="text-center w-1/4"><div className="h-10 bg-orange-500/60 rounded-t-sm mx-auto w-1/2"></div><p className="text-xs text-gray-400 mt-1">Medium</p></div>
                <div className="text-center w-1/4"><div className="h-16 bg-red-500/70 rounded-t-sm mx-auto w-1/2"></div><p className="text-xs text-gray-400 mt-1">High</p></div>
                <div className="text-center w-1/4"><div className="h-12 bg-orange-500/60 rounded-t-sm mx-auto w-1/2"></div><p className="text-xs text-gray-400 mt-1">Medium</p></div>
             </div>
           </div>
        </div>
         <p className="text-xs text-gray-500 text-center mt-6 max-w-2xl mx-auto">
            This predictive approach allows traders to anticipate market moves, prepare for volatility, and position themselves strategically before a signal is even generated.
        </p>
    </div>
);


// --- MAIN ML INTELLIGENCE COMPONENT ---
const MLIntelligence: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'smart' | 'predictive'>('smart');
    
    const TabButton: React.FC<{ tabName: 'smart' | 'predictive', children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === tabName ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-white'}`}
        >
            {children}
        </button>
    );

    return (
        <SectionCard title="ML Intelligence" iconClass="fa-solid fa-brain">
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <TabButton tabName="smart"><i className="fas fa-lightbulb mr-2"></i>Smart Signals</TabButton>
                    <TabButton tabName="predictive"><i className="fas fa-wand-magic-sparkles mr-2"></i>Predictive Forecasts</TabButton>
                </nav>
            </div>
            <div className="mt-6">
                {activeTab === 'smart' && <SmartSignalsContent />}
                {activeTab === 'predictive' && <PredictiveForecastsContent />}
            </div>
        </SectionCard>
    );
};

export default MLIntelligence;
