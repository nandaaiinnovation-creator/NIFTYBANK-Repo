import React from 'react';
import { useBroker } from '../contexts/BrokerContext';

const BrokerConnectModal: React.FC = () => {
    const { 
        isModalOpen, 
        closeModal, 
        status,
        message,
        apiKey,
        setApiKey,
        accessToken,
        setAccessToken,
        connect 
    } = useBroker();

    if (!isModalOpen) {
        return null;
    }

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        await connect();
    };

    const getStatusIndicator = () => {
        switch (status) {
            case 'connecting': return <span className="text-yellow-400 font-semibold flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Connecting...</span>;
            case 'reconnecting': return <span className="text-yellow-400 font-semibold flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Reconnecting...</span>;
            case 'error': return <span className="text-red-400 font-semibold flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i>Error</span>;
            default: return <span className="text-gray-400 font-semibold flex items-center"><i className="fas fa-plug mr-2"></i>Disconnected</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div 
                className="bg-zinc-800 w-full max-w-sm border border-zinc-700 shadow-lg" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-3 border-b border-zinc-700">
                    <h2 className="text-lg font-semibold text-white">Broker Connection</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-white text-sm">Connection Status</h3>
                        {getStatusIndicator()}
                    </div>
                     <p className="text-sm text-center text-gray-500 mb-4 h-8 flex items-center justify-center">{message}</p>
                     
                     <form onSubmit={handleConnect} className="space-y-3">
                        <div>
                            <label htmlFor="api-key" className="block text-xs font-medium text-gray-300 mb-1">API Key</label>
                            <input
                                type="password"
                                id="api-key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API Key"
                                className="w-full bg-zinc-700 border border-zinc-600 py-2 px-3 text-white text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="access-token" className="block text-xs font-medium text-gray-300 mb-1">Access Token</label>
                            <input
                                type="password"
                                id="access-token"
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="Enter your daily Access Token"
                                className="w-full bg-zinc-700 border border-zinc-600 py-2 px-3 text-white text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={status === 'connecting'} 
                            className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 text-sm transition-colors flex items-center justify-center gap-2"
                        >
                             {status === 'connecting' ? <><i className="fas fa-spinner fa-spin"></i>Connecting...</> : <><i className="fas fa-plug"></i>Connect</>}
                        </button>
                    </form>
                    <p className="text-xs text-gray-600 text-center mt-3">
                        <i className="fas fa-lock mr-1"></i> Your credentials are not stored.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BrokerConnectModal;