import React from 'react';
import SectionCard from './SectionCard';

const BackendImplementation: React.FC = () => {
    return (
        <SectionCard title="Backend Engine Implementation" iconClass="fa-solid fa-cogs">
            <p className="text-gray-400 mb-6">
                The complete, ready-to-run Node.js backend code is located in the <code className="text-cyan-300 bg-gray-900 px-2 py-1 rounded-md">/backend</code> directory at the root of this project. This separation makes the project cleaner and easier to manage.
            </p>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fab fa-node-js mr-3 text-green-400"></i>File: <code className="text-cyan-300">backend/server.js</code></h3>
                    <p className="text-gray-400">This file is the main entry point for the backend. It is responsible for:</p>
                     <ul className="list-disc list-inside text-gray-400 space-y-2 mt-2">
                        <li>Setting up the Express web server and REST API endpoints.</li>
                        <li>Initializing the WebSocket server for real-time communication.</li>
                        <li>Connecting to the PostgreSQL database and creating necessary tables on startup.</li>
                        <li>Instantiating the Price Action Engine and handling requests from the frontend.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3"><i className="fa-solid fa-gears mr-3 text-cyan-400"></i>File: <code className="text-cyan-300">backend/PriceActionEngine.js</code></h3>
                    <p className="text-gray-400">This file contains the core trading logic of the application. Its key responsibilities include:</p>
                     <ul className="list-disc list-inside text-gray-400 space-y-2 mt-2">
                        <li>Connecting to the Zerodha Kite Connect API using your credentials.</li>
                        <li>Fetching pre-market data and subscribing to a live stream of market ticks.</li>
                        <li>Processing each tick, building 1-minute candles in memory, and evaluating all trading rules.</li>
                        <li>Generating BUY/SELL signals when rules are met.</li>
                        <li>Saving every generated signal to the database for persistence.</li>
                        <li>Broadcasting new signals to the frontend via the WebSocket server.</li>
                    </ul>
                </div>
            </div>
        </SectionCard>
    );
};

export default BackendImplementation;
