import React from 'react';
import SignalCard from './SignalCard';
import SentimentGauge from './SentimentGauge';
import { exampleSignal1 } from '../constants';

const MockupDashboard: React.FC = () => {
    return (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mt-4">
            <h3 className="text-lg font-semibold text-center text-white mb-6">UI Mockup Idea: Main Dashboard</h3>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                <div className="w-full md:w-auto">
                    <p className="text-sm text-gray-400 text-center mb-2">Latest Signal</p>
                    <SignalCard signal={exampleSignal1} />
                </div>
                <div className="w-full md:w-auto">
                   <SentimentGauge />
                </div>
            </div>
        </div>
    );
}

export default MockupDashboard;
