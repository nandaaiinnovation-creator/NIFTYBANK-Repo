import React from 'react';
import { useBroker } from '../contexts/BrokerContext';

const Navbar: React.FC = () => {
    const { status, message, openModal } = useBroker();

    const StatusIndicator = () => {
        const baseClass = "w-2.5 h-2.5 rounded-full";
        switch (status) {
            case 'connected': return <div className={`${baseClass} bg-green-500 animate-pulse`} title="Connected"></div>;
            case 'connecting': return <div className={`${baseClass} bg-yellow-500 animate-pulse`} title="Connecting..."></div>;
            case 'reconnecting': return <div className={`${baseClass} bg-yellow-500 animate-pulse`} title="Reconnecting..."></div>;
            case 'error': return <div className={`${baseClass} bg-red-500`} title={message}></div>;
            default: return <div className={`${baseClass} bg-zinc-500`} title="Disconnected"></div>;
        }
    };

    return (
        <header className="bg-zinc-900 shadow-sm border-b border-zinc-800 flex-shrink-0">
            <div className="container mx-auto px-3 h-9 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-chart-pie text-md text-cyan-400"></i>
                    <h1 className="text-sm font-bold text-white hidden sm:block">BankNIFTY Signal Architect</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <StatusIndicator />
                        <span className="text-xs text-zinc-400 hidden md:block">{message}</span>
                    </div>
                    {(status === 'disconnected' || status === 'error') && (
                        <button 
                            onClick={openModal}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-2 py-0.5 rounded-sm transition-colors"
                        >
                            Connect
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;