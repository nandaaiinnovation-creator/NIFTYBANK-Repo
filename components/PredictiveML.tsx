import React from 'react';
import SectionCard from './SectionCard';

const PredictiveML: React.FC = () => {
  return (
    <SectionCard title="Predictive ML Forecasts" iconClass="fa-solid fa-wand-magic-sparkles">
      <p className="text-gray-400 mb-6 leading-relaxed">
        This represents the next evolution of the ML integration. Instead of only adjusting conviction scores after a signal is generated, this advanced model proactively forecasts future market behavior. It analyzes historical price action, volatility patterns, and order flow to predict high-probability breakout zones and periods of increased volatility before they happen.
      </p>
      
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-center text-white mb-2">Market Forecast Mockup</h3>
        <p className="text-sm text-gray-500 text-center mb-6">The model provides a visual forecast on the price chart.</p>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          {/* Chart Header */}
          <div className="flex items-center mb-4">
            <span className="text-white font-bold text-lg">BANKNIFTY</span>
            <span className="text-gray-400 text-sm ml-2">5 min Chart</span>
          </div>

          {/* Chart Body */}
          <div className="relative h-64 bg-gray-900/50 rounded-md p-2 flex items-end">
            {/* Mock Candlesticks */}
            <div className="flex items-end h-full gap-1">
                <div className="w-4 h-12 bg-red-500 rounded-sm"></div>
                <div className="w-4 h-16 bg-red-500 rounded-sm"></div>
                <div className="w-4 h-10 bg-green-500 rounded-sm"></div>
                <div className="w-4 h-24 bg-green-500 rounded-sm"></div>
                <div className="w-4 h-20 bg-red-500 rounded-sm"></div>
                <div className="w-4 h-32 bg-green-500 rounded-sm"></div>
            </div>

            {/* Predicted Breakout Zone Overlay */}
            <div className="absolute top-1/4 right-0 h-1/2 w-1/3 bg-cyan-500/10 border-l-2 border-cyan-500 border-dashed rounded-l-lg flex items-center justify-center">
               <div className="text-center p-2">
                 <p className="text-cyan-300 font-semibold text-sm">Predicted Breakout Zone</p>
                 <p className="text-cyan-400 text-xs">(High Probability)</p>
               </div>
            </div>
             <p className="absolute bottom-2 left-2 text-xs text-gray-500">Past Price Action</p>
             <p className="absolute bottom-2 right-2 text-xs text-gray-500">Future Forecast</p>
          </div>

          {/* Volatility Forecast */}
           <div className="mt-4">
             <h4 className="text-sm font-semibold text-white mb-2 text-center">Upcoming Volatility Forecast</h4>
             <div className="flex justify-around items-end h-20 bg-gray-900/50 rounded-md p-2">
                <div className="text-center w-1/4">
                    <div className="h-6 bg-yellow-500/50 rounded-t-sm mx-auto w-1/2"></div>
                    <p className="text-xs text-gray-400 mt-1">Low</p>
                </div>
                 <div className="text-center w-1/4">
                    <div className="h-10 bg-orange-500/60 rounded-t-sm mx-auto w-1/2"></div>
                    <p className="text-xs text-gray-400 mt-1">Medium</p>
                </div>
                 <div className="text-center w-1/4">
                    <div className="h-16 bg-red-500/70 rounded-t-sm mx-auto w-1/2"></div>
                    <p className="text-xs text-gray-400 mt-1">High</p>
                </div>
                 <div className="text-center w-1/4">
                    <div className="h-12 bg-orange-500/60 rounded-t-sm mx-auto w-1/2"></div>
                    <p className="text-xs text-gray-400 mt-1">Medium</p>
                </div>
             </div>
           </div>
        </div>

         <p className="text-xs text-gray-500 text-center mt-6">
            This predictive approach allows traders to anticipate market moves, prepare for volatility, and position themselves strategically before a signal is even generated.
        </p>
      </div>
    </SectionCard>
  );
};

export default PredictiveML;
