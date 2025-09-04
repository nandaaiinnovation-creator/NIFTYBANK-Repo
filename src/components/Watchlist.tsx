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
    const lastPrice = lastTick?.price ?? 54000.00;
    const priceColor = lastTick ? (lastPrice > 54000 ? 'text-green-400' : 'text-red-400') : 'text-gray-400';

    return (
        <aside className="w-52 bg-zinc-800 p-2 flex flex-col border-r border-zinc-700">
            {/* Instrument List */}
            <div className="flex-grow pt-1">
                <div className="flex justify-between items-center p-1.5 hover:bg-zinc-700/50 cursor-pointer">
                    <div>
                        <p className="text-xs font-bold text-white">BANKNIFTY</p>
                        <p className="text-xs text-gray-500">NFO</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-xs font-semibold ${priceColor}`}>{lastPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">+0.25%</p>
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
                                className={`w-full flex items-center gap-3 px-2 py-1.5 text-sm transition-colors ${
                                    activeSection === section.id
                                    ? 'bg-cyan-500/10 text-cyan-300'
                                    : 'text-gray-400 hover:bg-zinc-700/50'
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