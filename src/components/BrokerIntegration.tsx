import React, { useState } from 'react';
import SectionCard from './SectionCard';
import { useBroker } from '../contexts/BrokerContext';

const BrokerIntegration: React.FC = () => {
    const { 
        status, 
        message, 
        apiKey, 
        setApiKey, 
        accessToken, 
        setAccessToken, 
        connect, 
        disconnect 
    } = useBroker();
    
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);
        try {
            await connect();
        } catch (error) {
            // Error is already handled in context, but we can log it here if needed
            console.error("Connection attempt failed from component.");
        } finally {
            setIsConnecting(false);
        }
    };

    const getStatusIndicator = () => {
        switch (status) {
            case 'connected':
                return <span className="text-green-400 font-bold flex items-center"><i className="fas fa-check-circle mr-2"></i>Connected</span>;
            case 'connecting':
                 return <span className="text-yellow-400 font-bold flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Connecting...</span>;
            case 'error':
                 return <span className="text-red-400 font-bold flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i>Error</span>;
            case 'disconnected':
            default:
                return <span className="text-gray-400 font-bold flex items-center"><i className="fas fa-plug mr-2"></i>Disconnected</span>;
        }
    };

    return (
        <SectionCard title="Broker Integration (Zerodha Kite)" iconClass="fa-solid fa-link">
            <p className="text-gray-400 mb-6">
                To receive live market data, connect the application to your Zerodha account. You'll need your Kite Connect API Key and a daily Access Token, which you can generate each morning.
            </p>

            <div className="max-w-md mx-auto bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-white">Connection Status</h3>
                    {getStatusIndicator()}
                </div>
                
                <p className="text-sm text-center text-gray-500 mb-6 h-10 flex items-center justify-center">{message}</p>

                {status !== 'connected' ? (
                    <form onSubmit={handleConnect} className="space-y-4">
                        <div>
                            <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                            <input
                                type="password"
                                id="api-key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API Key"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="access-token" className="block text-sm font-medium text-gray-300 mb-1">Access Token</label>
                            <input
                                type="password"
                                id="access-token"
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="Enter your daily Access Token"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isConnecting} 
                            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                             {isConnecting ? <><i className="fas fa-spinner fa-spin"></i>Connecting...</> : <><i className="fas fa-plug"></i>Connect</>}
                        </button>
                    </form>
                ) : (
                    <button 
                        onClick={disconnect}
                        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-times-circle"></i>Disconnect
                    </button>
                )}
                 <p className="text-xs text-gray-600 text-center mt-4">
                    <i className="fas fa-lock mr-1"></i> Your credentials are sent to your local backend only and are not stored.
                </p>
            </div>
        </SectionCard>
    );
};

export default BrokerIntegration;
