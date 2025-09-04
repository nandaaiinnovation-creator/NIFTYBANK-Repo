import React from 'react';
import type { Section } from '../types';
import { sections } from '../constants';
import { useBroker } from '../contexts/BrokerContext';

interface WatchlistProps {
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ activeSection, setActiveSection }) => {
    const { lastTick } = useBroker();
    const lastPrice = lastTick?.price ?? 0.00;
    
    // A simple way to show price change without a real previous close
    const previousClose = 54000; 
    const priceChange = lastPrice - previousClose;
    const priceChangePercent = lastPrice > 0 ? (priceChange / previousClose) * 100 : 0;
    const priceColor = priceChange >= 0 ? 'text-green-400' : 'text-red-400';


    return (
        <aside className="w-48 bg-zinc-900 p-2 flex flex-col border-r border-zinc-800">
            {/* Instrument List */}
            <div className="flex-grow pt-1">
                 <div className="flex justify-between items-center p-1.5 hover:bg-zinc-800/50 cursor-pointer rounded-sm">
                    <div>
                        <p className="text-xs font-bold text-white">BANKNIFTY</p>
                        <p className="text-[10px] text-zinc-500">INDEX</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs font-semibold font-mono ${priceColor}`}>{lastPrice.toFixed(2)}</p>
                        <p className={`text-[10px] font-mono ${priceColor}`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav>
                <ul className="space-y-1">
                    {sections.map(section => (
                        <li key={section.id}>
                            <button
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-sm transition-colors ${
                                    activeSection === section.id
                                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                                    : 'text-zinc-400 hover:bg-zinc-700/50'
                                }`}
                            >
                                <i className={`${section.iconClass} w-4 text-center text-xs`}></i>
                                <span>{section.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Watchlist;