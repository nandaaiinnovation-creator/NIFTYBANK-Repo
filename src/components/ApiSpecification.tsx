import React from 'react';
import SectionCard from './SectionCard';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-900 p-4 rounded-md text-sm text-cyan-300 font-mono overflow-x-auto my-2">
        <code>{children}</code>
    </pre>
);

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold text-white ${className}`}>
        {children}
    </span>
);


const ApiSpecification: React.FC = () => {
    return (
        <SectionCard title="API Specification for Backend" iconClass="fa-solid fa-code-branch">
            <p className="text-gray-400 mb-6">
                This document outlines the API contract between the frontend application and the backend server. The backend should implement these endpoints and WebSocket events to ensure seamless integration.
            </p>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fas fa-network-wired mr-3 text-cyan-400"></i>WebSocket for Live Signals</h3>
                    <p className="text-gray-400 mb-2">The primary method for real-time communication. The server pushes new signals to connected clients.</p>
                    
                    <h4 className="font-semibold text-gray-300 mt-4">Connection</h4>
                    <p className="text-sm text-gray-500">Clients will connect to the WebSocket endpoint, e.g., <code className="text-xs bg-gray-700 px-1 rounded">ws://your-domain.com</code> or <code className="text-xs bg-gray-700 px-1 rounded">ws://localhost:8080</code>.</p>
                    
                    <h4 className="font-semibold text-gray-300 mt-4">Server-to-Client Events</h4>
                    <p className="text-sm text-gray-500">The server sends a `new_signal` event whenever the Price Action Engine generates a valid trading signal.</p>
                    
                    <h5 className="font-semibold text-gray-300 mt-2">Event: <code className="text-sm bg-gray-700 px-1 rounded">new_signal</code></h5>
                    <p className="text-sm text-gray-500">Payload should be a JSON object matching the `Signal` interface.</p>
                    <CodeBlock>{`{
  "type": "new_signal",
  "payload": {
    "time": "10:18 AM",
    "symbol": "BANKNIFTY",
    "price": 54000,
    "direction": "BUY",
    "rulesPassed": ["PrevDayLevels", "SupportResistance"],
    "rulesFailed": [],
    "conviction": 72
  }
}`}</CodeBlock>
                </div>
                
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fas fa-server mr-3 text-cyan-400"></i>REST API Endpoints</h3>
                    <p className="text-gray-400 mb-2">Standard HTTP endpoints for non-real-time actions like backtesting and configuration management.</p>

                    {/* Broker Connection Endpoint */}
                    <div className="mt-4">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600">POST</Badge>
                            <code className="text-md text-gray-300">/api/broker/connect</code>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Validates and establishes a session with the broker using the provided credentials.</p>
                        <h5 className="font-semibold text-gray-300 mt-2">Request Body</h5>
                        <CodeBlock>{`{
  "apiKey": "your_api_key",
  "accessToken": "your_daily_access_token"
}`}</CodeBlock>
                        <h5 className="font-semibold text-gray-300 mt-2">Success Response (200 OK)</h5>
                        <CodeBlock>{`{ "status": "success", "message": "Successfully connected to broker." }`}</CodeBlock>
                        <h5 className="font-semibold text-gray-300 mt-2">Error Response (401 Unauthorized)</h5>
                        <CodeBlock>{`{ "status": "error", "message": "Invalid API Key or Access Token." }`}</CodeBlock>
                    </div>

                     {/* Backtesting Endpoint */}
                    <div className="mt-6">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600">POST</Badge>
                            <code className="text-md text-gray-300">/api/backtest</code>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Runs a historical backtest with the provided configuration.</p>
                        <h5 className="font-semibold text-gray-300 mt-2">Request Body</h5>
                        <CodeBlock>{`{
  "period": "3", // "1", "3", or "5" years
  "timeframe": "3m",
  "stopLoss": 0.5,
  "takeProfit": 1.0,
  "rulesConfig": [ { "title": "...", "isActive": true, "weight": 1.0 }, ... ]
}`}</CodeBlock>
                        <h5 className="font-semibold text-gray-300 mt-2">Success Response (200 OK)</h5>
                        <CodeBlock>{`{
  "period": "3 Years",
  "winRate": "68.5%",
  "profitFactor": "2.1",
  "totalTrades": "452",
  "maxDrawdown": "12.3%"
}`}</CodeBlock>
                    </div>

                    {/* Rule Configuration Endpoint */}
                    <div className="mt-6">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600">POST</Badge>
                            <code className="text-md text-gray-300">/api/rules</code>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Saves a user's custom rule configuration.</p>
                         <h5 className="font-semibold text-gray-300 mt-2">Request Body</h5>
                        <p className="text-sm text-gray-500">An array of `CustomizableRule` objects.</p>
                        <CodeBlock>{`[
  {
    "title": "Previous Day Levels",
    "description": "...",
    "isActive": true,
    "weight": 1.2
  },
  ...
]`}</CodeBlock>
                        <h5 className="font-semibold text-gray-300 mt-2">Success Response (200 OK)</h5>
                        <CodeBlock>{`{ "status": "success", "message": "Configuration saved." }`}</CodeBlock>
                    </div>

                </div>
            </div>
        </SectionCard>
    );
};

export default ApiSpecification;
