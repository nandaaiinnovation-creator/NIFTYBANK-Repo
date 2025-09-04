import React, { useState } from 'react';
import RuleCard from './RuleCard';
import SignalCard from './SignalCard';
import TechStackCard from './TechStackCard';
import { tradingRules, frontendTech, backendTech, exampleSignal1 } from '../constants';

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
const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => <pre className="bg-zinc-950 p-2 text-xs text-cyan-300 font-mono overflow-x-auto my-2 border border-zinc-800 rounded-sm"><code>{children}</code></pre>;

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
        <CodeBlock>{`# See the file DeploymentGuide.tsx for the full Docker configurations.`}</CodeBlock>
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
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
            <i className={`fa-solid ${icon} mr-2 text-cyan-400`}></i>{title}
        </h3>
    );
    const SubHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => <h4 className="font-semibold text-white mt-3 mb-1 text-xs">{children}</h4>;
    const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-zinc-400 text-xs mb-2 leading-relaxed">{children}</p>;
    const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => <li className="text-zinc-400 text-xs">{children}</li>;
    const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <code className="text-cyan-300 bg-zinc-800 px-1 py-0.5 rounded-sm text-[10px] font-mono">{children}</code>;
    
    return (
        <div className="space-y-4">
            <P>This document provides a comprehensive architectural overview of the BankNIFTY Trading Signal Architect application, detailing its components, data flow, and core logic.</P>
            
            <div>
                <SectionHeader icon="fa-cubes-stacked" title="Core Components & Technology Stack" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <SubHeader>Frontend</SubHeader>
                        <ul className="list-disc list-inside space-y-1">
                            <Li><Code>React & TypeScript</Code>: For a robust, type-safe, and interactive single-page application.</Li>
                            <Li><Code>Tailwind CSS</Code>: For a utility-first, professional, and responsive UI design.</Li>
                            <Li><Code>TradingView Library</Code>: For professional-grade, real-time financial charting.</Li>
                        </ul>
                    </div>
                    <div>
                        <SubHeader>Backend</SubHeader>
                         <ul className="list-disc list-inside space-y-1">
                            <Li><Code>Node.js & Express</Code>: A fast and efficient runtime for handling API requests and business logic.</Li>
                            <Li><Code>WebSocket (ws)</Code>: Enables real-time, bidirectional communication for instant data delivery.</Li>
                            <Li><Code>Zerodha Kite Connect</Code>: Official SDK for connecting to the broker's API and WebSocket feed.</Li>
                        </ul>
                    </div>
                    <div>
                         <SubHeader>Database</SubHeader>
                         <ul className="list-disc list-inside space-y-1">
                             <Li><Code>PostgreSQL</Code>: A powerful relational database for storing all generated signals and historical market data.</Li>
                         </ul>
                    </div>
                </div>
            </div>

            <div>
                <SectionHeader icon="fa-diagram-project" title="End-to-End Data Flow" />
                <P>The system operates on a continuous, real-time data pipeline from the market to the user's screen.</P>
                <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-400">
                    <li><Code>Data Ingestion</Code>: The backend's <Code>PriceActionEngine.js</Code> establishes a WebSocket connection to the Zerodha Kite API. It subscribes to live market ticks for the BankNIFTY instrument.</li>
                    <li><Code>Backend Processing</Code>: Each incoming tick is processed by the engine. It updates the current price and contributes to building candlestick data for multiple timeframes (1m, 3m, 5m, 15m).</li>
                    <li><Code>Rule Evaluation</Code>: On the close of a candle for a specific timeframe, the engine evaluates it against a set of predefined trading rules (e.g., "Previous Day Levels", "Volume Analysis").</li>
                    <li><Code>Signal Generation</Code>: If enough rules pass, a BUY or SELL signal is generated. A conviction score is calculated based on the weight of the passed rules.</li>
                    <li><Code>Data Persistence</Code>: The newly generated signal is immediately saved to the <Code>signals</Code> table in the PostgreSQL database.</li>
                    <li><Code>Real-time Broadcast</Code>: The backend broadcasts the signal and the live market tick to all connected frontend clients via its own WebSocket server.</li>
                    <li><Code>Frontend Display</Code>: The React frontend, listening via the <Code>BrokerContext</Code>, receives the new signal and instantly updates the UI, displaying it in the relevant signal log and plotting it on the TradingView chart.</li>
                </ol>
            </div>

            <div>
                <SectionHeader icon="fa-gears" title="Engine & Rule Logic" />
                <P>The core logic resides in <Code>PriceActionEngine.js</Code>. It's a stateful service that maintains the current market context.</P>
                <SubHeader>Candle Construction</SubHeader>
                <P>The engine listens for individual ticks. It aggregates these ticks into candles for each defined timeframe. For example, for a '3m' candle, it will collect ticks for 3 minutes, then "close" the candle and begin a new one. This ensures analysis happens on structured, time-based data.</P>
                <SubHeader>Rule Evaluation Logic</SubHeader>
                <P>The <Code>_evaluateRules</Code> function is the brain of the signal generation. It takes a closed candle and checks it against conditions. For instance, the "Previous Day Levels" rule checks if the candle's closing price has crossed above the previous day's high or below the previous day's low. Each rule that passes contributes to the final conviction score.</P>
            </div>

            <div>
                 <SectionHeader icon="fa-backward-fast" title="Backtesting & Caching" />
                 <P>The backtesting engine simulates the trading logic on historical data to evaluate strategy performance.</P>
                 <SubHeader>Smart Caching Strategy</SubHeader>
                 <P>To balance speed and data accuracy, the engine uses a "cache-then-validate" approach. When a backtest is requested for a period:</P>
                 <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-400">
                     <li>It first fetches the complete, official data for that period from the Zerodha API.</li>
                     <li>It then uses an <Code>INSERT ... ON CONFLICT DO NOTHING</Code> query to efficiently update the local <Code>historical_candles</Code> table in PostgreSQL. This fills any gaps in the local cache without creating duplicates.</li>
                     <li>Finally, the backtest simulation runs its analysis against the fast, local PostgreSQL database.</li>
                 </ol>
                 <P>This ensures the local cache becomes more complete over time and subsequent tests on overlapping periods are significantly faster. If the broker API is down, it gracefully falls back to using only the data available locally.</P>
            </div>

            <div>
                 <SectionHeader icon="fa-brain" title="ML Intelligence & Feedback Loop" />
                 <P>The current "ML Intelligence" section serves as a powerful, data-driven feedback mechanism for the rule-based engine.</P>
                 <SubHeader>Performance Analysis</SubHeader>
                 <P>The "Performance Analysis" feature is not a predictive model but a post-trade validation tool. When run, it:</P>
                 <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-400">
                    <li>Queries the database for all signals generated in the last 24 hours.</li>
                    <li>Fetches the 1-minute historical candle data for the period following each signal.</li>
                    <li>Simulates each trade with a predefined Stop Loss (0.5%) and Take Profit (1%) to determine if it was a "Win" or a "Loss".</li>
                    <li>Aggregates these results to calculate the overall strategy win rate and, crucially, the individual performance of each trading rule.</li>
                 </ol>
                 <P>This provides actionable insights, allowing the user to identify which rules are most effective and which may need tuning, thus closing the feedback loop on strategy development.</P>
            </div>
            
            <div>
                 <SectionHeader icon="fa-database" title="Data Storage" />
                 <P>Data is stored in a PostgreSQL database, structured into several key tables:</P>
                 <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                     <li><Code>signals</Code>: Stores every generated signal, including the price, direction, conviction, and which rules passed or failed. This is the primary table for historical review.</li>
                     <li><Code>historical_candles</Code>: Acts as a local cache for candlestick data fetched from the broker. This speeds up backtesting and historical chart loads.</li>
                     <li><Code>user_rule_configurations</Code>: A table designed to store user-specific modifications to the trading rules (a feature planned for future work).</li>
                 </ul>
            </div>
        </div>
    );
};


const architectureSections = {
    'System Blueprint': { 'Blueprint': <SystemBlueprintContent /> },
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