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
            default: return <div className={`${baseClass} bg-gray-500`} title="Disconnected"></div>;
        }
    };

    return (
        <header className="bg-zinc-800 shadow-sm border-b border-zinc-700 flex-shrink-0">
            <div className="container mx-auto px-3 h-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-chart-pie text-lg text-cyan-400"></i>
                    <h1 className="text-md font-bold text-white hidden sm:block">BankNIFTY Signal Architect</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <StatusIndicator />
                        <span className="text-xs text-gray-400 hidden md:block">{message}</span>
                    </div>
                    {(status === 'disconnected' || status === 'error') && (
                        <button 
                            onClick={openModal}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-3 py-1 transition-colors"
                        >
                            Connect
                        </button>
                    )}
                     <div className="flex items-center gap-2">
                        <i className="fa-regular fa-user-circle text-lg text-gray-500"></i>
                         <div className="hidden lg:block">
                            <p className="text-xs font-semibold text-white">Guest User</p>
                            <p className="text-xs text-gray-500">GU1234</p>
                         </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;