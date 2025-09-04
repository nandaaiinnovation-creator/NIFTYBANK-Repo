import React, { useState } from 'react';
import RuleCard from './RuleCard';
import TechStackCard from './TechStackCard';
import { tradingRules, frontendTech, backendTech } from '../constants';

// --- CONTENT COMPONENTS ---
const OverviewContent: React.FC = () => (
  <>
    <p className="text-zinc-400 leading-relaxed mb-3 text-xs">
      This is a fully functional, end-to-end web application designed to generate real-time trading signals for the BankNIFTY index. The system is architected for live market operation, processing live broker data and persisting all signals to a database.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
        <h3 className="font-semibold text-sm text-green-400 mb-2">What's Completed?</h3>
        <ul className="list-disc list-inside text-zinc-400 space-y-1.5 text-xs">
          <li>Complete End-to-End Application (Frontend, Backend, DB).</li>
          <li>Live Broker Integration with Zerodha Kite API.</li>
          <li>Stateful Price Action Engine for real-time analysis.</li>
          <li>Database Persistence for all signals and configurations.</li>
          <li>High-Performance Backtesting with smart caching.</li>
          <li>Interactive ML Analysis with custom SL/TP strategies.</li>
          <li>Dynamic, Real-Time Market Sentiment Gauge.</li>
          <li>Resilient Charting with graceful library fallback.</li>
        </ul>
      </div>
      <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
        <h3 className="font-semibold text-sm text-orange-400 mb-2">Next Steps to Go-Live</h3>
        <ul className="list-disc list-inside text-zinc-400 space-y-1.5 text-xs">
          <li>Deploy full stack to a cloud server using Docker.</li>
          <li>Implement live monitoring and alerting (e.g., Sentry).</li>
          <li>Fine-tune rule weights based on live performance data.</li>
          <li>Backfill database with historical data for robust backtesting.</li>
        </ul>
      </div>
    </div>
  </>
);

const TradingLogicContent: React.FC = () => (
  <>
    <p className="text-zinc-400 mb-3 text-xs">The core Price Action Engine evaluates the market against a set of 12+ rules. A signal's conviction is calculated based on the rules passed and their assigned weight.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {tradingRules.map((rule) => ( <RuleCard key={rule.title} title={rule.title} description={rule.description} /> ))}
    </div>
  </>
);

const TechStackContent: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center"><i className="fa-brands fa-react mr-2 text-cyan-400"></i>Front-end</h3>
            <div className="space-y-2">
                {frontendTech.map((tech) => ( <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} /> ))}
            </div>
        </div>
        <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center"><i className="fa-brands fa-node-js mr-2 text-green-400"></i>Back-end</h3>
            <div className="space-y-2">
                {backendTech.map((tech) => ( <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} /> ))}
            </div>
        </div>
    </div>
);

const BackendImplementationContent: React.FC = () => (
     <div className="space-y-3 text-sm">
        <p className="text-zinc-400 text-xs">The complete, ready-to-run Node.js backend code is in the <code className="text-cyan-300 bg-zinc-900/50 px-1 py-0.5 rounded-sm">/backend</code> directory.</p>
        <div>
            <h3 className="text-sm font-semibold text-white mb-1">File: <code className="text-cyan-300">backend/server.js</code></h3>
            <p className="text-zinc-400 text-xs">Sets up the Express server, WebSocket server, database connection, and API endpoints.</p>
        </div>
        <div>
            <h3 className="text-sm font-semibold text-white mb-1">File: <code className="text-cyan-300">backend/PriceActionEngine.js</code></h3>
            <p className="text-zinc-400 text-xs">Contains the core trading logic: connects to broker, processes ticks, evaluates rules, and generates signals.</p>
        </div>
    </div>
);

const DeploymentGuideContent: React.FC = () => (
    <div className="space-y-4">
        <p className="text-zinc-400 text-xs">The application is fully containerized using Docker for easy and consistent deployment. The root directory contains all necessary files.</p>
        <p className="text-zinc-400 text-xs">Full instructions are available in the project `README.md`.</p>
    </div>
);

const RecommendationsContent: React.FC = () => (
    <div className="space-y-4">
        <p className="text-zinc-400 text-xs">
            With the core system fully operational, the roadmap focuses on evolving from a signal generator into a comprehensive, intelligent trading assistant.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                <h4 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-brain mr-2 text-cyan-400"></i>Signal Generation &amp; AI</h4>
                <ul className="list-disc list-inside text-zinc-400 space-y-2 text-xs">
                    <li><strong>Generative AI Strategy Assistant:</strong> Use Gemini API to analyze performance and suggest new, optimized trading rules.</li>
                    <li><strong>Advanced Options Strategies:</strong> Recommend specific options strategies (e.g., Spreads, Straddles) based on market conditions.</li>
                    <li><strong>Market Regime Detection:</strong> Implement a model to classify the market as 'Trending' or 'Ranging' and apply different rule sets.</li>
                </ul>
            </div>
            <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                <h4 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-shield-halved mr-2 text-cyan-400"></i>Execution &amp; Risk</h4>
                <ul className="list-disc list-inside text-zinc-400 space-y-2 text-xs">
                     <li><strong>Automated Trade Execution:</strong> Develop a module to place trades via broker API, including bracket orders.</li>
                     <li><strong>Dynamic Position Sizing:</strong> Automatically calculate optimal trade size based on account equity and volatility.</li>
                     <li><strong>Paper Trading Mode:</strong> Implement a simulated trading environment to test execution logic with zero risk.</li>
                </ul>
            </div>
            <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                <h4 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-chart-pie mr-2 text-cyan-400"></i>Advanced Analytics</h4>
                <ul className="list-disc list-inside text-zinc-400 space-y-2 text-xs">
                    <li><strong>Personalized Performance Dashboard:</strong> Create a detailed trading journal that tracks P&amp;L and draws an equity curve.</li>
                    <li><strong>Order Flow & Depth Analysis:</strong> Integrate Level 2 market depth data to analyze the order book for absorption.</li>
                    <li><strong>Inter-market Correlation:</strong> Add widgets to track and analyze correlations with other key instruments.</li>
                </ul>
            </div>
        </div>
    </div>
);

const SystemBlueprintContent: React.FC = () => {
    const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
        <h3 className="text-base font-semibold text-white mb-2 flex items-center">
            <i className={`fa-solid ${icon} mr-3 text-cyan-400`}></i>{title}
        </h3>
    );
    const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-zinc-400 text-sm mb-2 leading-relaxed">{children}</p>;
    const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <code className="text-cyan-300 bg-zinc-800 px-1 py-0.5 rounded-sm text-xs font-mono">{children}</code>;
    
    return (
        <div className="space-y-6">
            <div>
                <SectionHeader icon="fa-satellite-dish" title="The Journey of a Live Signal" />
                <P>This is the step-by-step process of how a signal is created, from the live market right to your screen.</P>
                <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
                    <li><strong className="text-zinc-300">Live Market Connection:</strong> The system opens a direct, live connection (a WebSocket) to the broker (Zerodha) to receive every single price change—a "tick"—as it happens.</li>
                    <li><strong className="text-zinc-300">The Engine Analyzes:</strong> Our "Price Action Engine" is the brain of the backend. It listens to these ticks and builds them into candlesticks for different timeframes (3-min, 5-min, etc.).</li>
                    <li><strong className="text-zinc-300">Checking the Rules:</strong> At the close of each candle, the Engine checks it against a list of pre-defined trading rules (our strategy). For example: "Did the price break above yesterday's high?".</li>
                    <li><strong className="text-zinc-300">Creating a Signal:</strong> If enough rules are met, the Engine generates a **BUY** or **SELL** signal, complete with a "conviction score" based on which rules passed. At the same time, it calculates a live **Market Sentiment** score based on recent signals.</li>
                    <li><strong className="text-zinc-300">Instant Delivery:</strong> The signal and the new sentiment score are instantly sent from the backend to your screen, so you see it in real-time.</li>
                </ol>
            </div>

            <div>
                 <SectionHeader icon="fa-backward-fast" title="Testing with Historical Data (Backtesting)" />
                 <P>The Backtesting Engine is like a time machine for our strategy. It lets us see how our rules would have performed on any day in the past.</P>
                 <P>To keep the application fast and prevent crashes, only the results (like win rate) are sent back initially. The chart then intelligently loads only the visual data it needs, making even long backtests very efficient. It also uses a "smart caching" system to make future tests on the same period much faster.</P>
            </div>

            <div>
                 <SectionHeader icon="fa-user-tie" title="Learning from Past Performance (ML Feedback)" />
                 <P>The "Performance Analysis" tool acts like a performance coach. It analyzes signals from the last 24 hours to give us a data-driven feedback loop.</P>
                 <P>You can even input your own **Stop Loss and Take Profit percentages** to see how the signals would have performed with your specific trading strategy. It then creates a "Performance Report" showing the overall win rate and which of our trading rules are the most (and least) effective.</P>
            </div>
            
            <div>
                 <SectionHeader icon="fa-book-bookmark" title="Where We Keep Our Data" />
                 <P>Our database is a digital filing cabinet that stores two key types of information:</P>
                 <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
                     <li><strong className="text-zinc-300">Signal History (<Code>signals</Code>):</strong> A permanent, detailed record of every single signal our system has ever generated.</li>
                     <li><strong className="text-zinc-300">Market Data (<Code>historical_candles</Code>):</strong> This is our local library of past market data. It allows our "Time Machine" (the backtester) to work quickly and efficiently.</li>
                 </ul>
            </div>
        </div>
    );
};

const TechnicalDeepDiveContent: React.FC = () => {
    const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
        <h3 className="text-base font-semibold text-white mb-2 flex items-center">
            <i className={`fa-solid ${icon} mr-3 text-cyan-400`}></i>{title}
        </h3>
    );
    const SubHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <h4 className="font-semibold text-white mt-3 mb-1 text-sm">{children}</h4>;
    const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-zinc-400 text-sm mb-2 leading-relaxed">{children}</p>;
    const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <code className="text-cyan-300 bg-zinc-800 px-1 py-0.5 rounded-sm text-xs font-mono">{children}</code>;
    
    return (
        <div className="space-y-6">
            <div>
                <SectionHeader icon="fa-display" title="Frontend Architecture (React + TypeScript)" />
                <SubHeader>Core State Management: <Code>BrokerContext</Code></SubHeader>
                <P>The <Code>BrokerContext</Code> is the central nervous system of the frontend. It encapsulates all WebSocket communication logic and acts as a global state provider for broker status, market status, live ticks, and generated signals. It features granular controls for live data streams and a signal batching mechanism to prevent UI lag.</P>
                <SubHeader>Component Structure</SubHeader>
                <P><Code>App.tsx</Code> provides the main layout shell (<Code>Navbar</Code>, <Code>Watchlist</Code>). The <Code>Dashboard.tsx</Code> component serves as the primary real-time view. The <Code>TradingViewChart.tsx</Code> is a resilient component that gracefully handles the absence of its commercial library by displaying a helpful placeholder instead of crashing the application.</P>
            </div>
            <div>
                <SectionHeader icon="fa-server" title="Backend Architecture (Node.js + Express + WebSocket)" />
                <SubHeader>The Core Engine: <Code>PriceActionEngine.js</Code></SubHeader>
                <P>This is a stateful class that acts as the brain of the backend. A single instance manages the broker connection, processes all incoming market ticks, aggregates them into candles, and holds the current market state. It also now includes logic to calculate real-time market sentiment and has been standardized to use UTC for time-sensitive operations to prevent timezone-related bugs.</P>
            </div>
            <div>
                <SectionHeader icon="fa-arrows-left-right-to-line" title="Communication Pipeline" />
                <SubHeader>WebSocket Events (Real-time)</SubHeader>
                <P>The backend pushes data to all connected clients via specific events: <Code>new_signal</Code>, <Code>market_tick</Code>, <Code>broker_status_update</Code>, <Code>market_status_update</Code>, and <Code>market_sentiment_update</Code>.</P>
                <SubHeader>REST APIs (Request/Response)</SubHeader>
                <P>Used for non-real-time actions like <Code>POST /api/broker/connect</Code>, <Code>POST /api/backtest</Code>, and <Code>POST /api/ml/analyze-signals</Code> (which now accepts custom SL/TP parameters).</P>
            </div>
            <div>
                <SectionHeader icon="fa-database" title="Database Schema & Caching Strategy" />
                <SubHeader>Smart Caching Mechanism</SubHeader>
                <P>The <Code>_getHistoricalDataWithCache</Code> function is key to the backtesting engine's performance. It always attempts to fetch fresh data from the broker first. It then uses an efficient <Code>INSERT ... ON CONFLICT DO NOTHING</Code> query to merge this data into the local cache, filling any gaps. The backtest then runs against this complete local dataset. If the broker fetch fails, it gracefully falls back to using only the data already in the cache.</P>
            </div>
        </div>
    );
};


const architectureSections = {
    'System Blueprint': { 'Blueprint': <SystemBlueprintContent /> },
    'Technical Details': { 'Deep Dive': <TechnicalDeepDiveContent /> },
    'Introduction': { 'Overview': <OverviewContent /> },
    'System Design': { 'Trading Logic': <TradingLogicContent />, 'Tech Stack': <TechStackContent /> },
    'Implementation': { 'Backend': <BackendImplementationContent />, 'Deployment': <DeploymentGuideContent /> },
    'Advanced Concepts': { 'Future Recommendations': <RecommendationsContent /> }
};

type Category = keyof typeof architectureSections;
type AnySubCategory = { [K in Category]: keyof (typeof architectureSections)[K] }[Category];

const SystemArchitecture: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<Category>('System Blueprint');
    const [activeSubCategory, setActiveSubCategory] = useState<AnySubCategory>('Blueprint');

    const handleCategoryClick = (category: Category) => {
        setActiveCategory(category);
        const firstSubCategory = Object.keys(architectureSections[category])[0] as AnySubCategory;
        setActiveSubCategory(firstSubCategory);
    };
    
    const ActiveComponent = (architectureSections[activeCategory] as any)[activeSubCategory];
    
    return (
        <div className="bg-zinc-900 border border-zinc-700 h-full flex flex-col p-2 gap-2">
             <div className="flex items-center flex-shrink-0">
                <i className="fa-solid fa-sitemap text-md text-cyan-400 mr-2"></i>
                <h2 className="text-md font-semibold text-white">System Architecture</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-3 flex-grow overflow-hidden">
                <aside className="md:w-48 flex-shrink-0">
                    <nav className="flex flex-col space-y-1">
                        {(Object.keys(architectureSections) as Category[]).map(category => (
                            <button 
                                key={category} 
                                onClick={() => handleCategoryClick(category)}
                                className={`px-2 py-1 text-left font-semibold text-xs rounded-sm transition-colors ${activeCategory === category ? 'bg-cyan-500/10 text-cyan-300' : 'text-zinc-300 hover:bg-zinc-700/50'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 p-2 flex flex-col">
                     <div className="border-b border-zinc-800 mb-2 flex-shrink-0">
                        <nav className="-mb-px flex gap-3 overflow-x-auto" aria-label="Tabs">
                             {(Object.keys(architectureSections[activeCategory]) as AnySubCategory[]).map(subCategory => (
                                 <button
                                    key={subCategory}
                                    onClick={() => setActiveSubCategory(subCategory)}
                                    className={`px-1 pb-1 font-medium text-xs border-b-2 whitespace-nowrap transition-colors ${activeSubCategory === subCategory ? 'text-cyan-400 border-cyan-400' : 'text-zinc-400 border-transparent hover:text-white'}`}
                                >
                                    {subCategory}
                                </button>
                             ))}
                        </nav>
                    </div>
                    <div className="p-1 flex-grow overflow-y-auto">
                       {ActiveComponent}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SystemArchitecture;