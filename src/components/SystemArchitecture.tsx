import React, { useState } from 'react';
import RuleCard from './RuleCard';
import TechStackCard from './TechStackCard';
import { tradingRules, frontendTech, backendTech } from '../constants';

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
                <P>This is the step-by-step process of how a high-quality signal is created, from the live market right to your screen, using a multi-layered, adaptive approach.</P>
                <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-400">
                    <li><strong className="text-zinc-300">Live Market Connection:</strong> The system opens a direct WebSocket connection to the broker to receive every single price "tick" as it happens. It also subscribes to live data for BankNIFTY's top component stocks and fetches live Options OI data.</li>
                    <li><strong className="text-zinc-300">The Engine Analyzes & Adapts:</strong> Our "Price Action Engine" is the brain. It builds candlesticks and, at the close of each candle, it first adapts its strategy by selecting a <Code>Strategic Playbook</Code> based on current market volatility (VIX).</li>
                    <li><strong className="text-zinc-300">Building a Consensus:</strong> The Engine then evaluates the market against its full suite of over 10 active trading rules. It doesn't look for a single pattern, but rather a <Code>consensus</Code> of evidence for a bullish or bearish move.</li>
                    <li><strong className="text-zinc-300">Generating the Signal:</strong> If a clear consensus is reached, the Engine generates a signal (<Code>STRONG_BUY</Code>, <Code>BUY</Code>, etc.) with a conviction score based on the rules that passed.</li>
                     <li><strong className="text-zinc-300">Learning in Real-Time:</strong> The Engine's <Code>Intraday Feedback Loop</Code> tracks the outcome of its own signals. It dynamically adjusts the influence of its rules throughout the day, giving more weight to rules that are currently working well.</li>
                    <li><strong className="text-zinc-300">Instant Delivery:</strong> The final, intelligent signal is instantly sent from the backend to your screen for you to see in real-time.</li>
                </ol>
            </div>

            <div>
                 <SectionHeader icon="fa-backward-fast" title="Testing with the Backtesting Engine" />
                 <P>The Backtesting Engine is a professional-grade time machine for our strategy. It now includes advanced features like an <Code>ATR-based Stop Loss</Code> to adapt to volatility and a <Code>Walk-Forward Optimization</Code> mode—the gold standard for validating a strategy's robustness and preventing overfitting.</P>
            </div>

            <div>
                 <SectionHeader icon="fa-user-tie" title="The Two Learning Loops" />
                 <P>The system features two distinct feedback mechanisms to ensure continuous improvement:</P>
                 <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
                    <li><strong className="text-zinc-300">The Intraday Feedback Loop:</strong> A real-time, automated process where the engine learns from its own performance *during the day* and dynamically adjusts its strategy.</li>
                    <li><strong className="text-zinc-300">The AI-Powered Strategic Loop:</strong> An on-demand tool where you send your backtest results to the Gemini AI to receive high-level, actionable suggestions on how to improve the strategy's core logic for the long term.</li>
                 </ul>
            </div>
        </div>
    );
};

const TradingLogicContent: React.FC = () => (
  <>
    <p className="text-zinc-400 mb-3 text-xs">
        The core Price Action Engine is a sophisticated, multi-layered system. It uses a **consensus model** to evaluate the market against its full suite of active rules. This is then filtered through two adaptive layers: **Strategic Playbooks** that change strategy based on VIX, and a **Dynamic Feedback Loop** that learns from intraday performance. The following rules are all fully implemented and functional:
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {tradingRules.map((rule) => ( <RuleCard key={rule.title} title={rule.title} description={rule.description} /> ))}
    </div>
  </>
);

const UIDesignContent: React.FC = () => (
    <>
        <p className="text-zinc-400 mb-3 text-xs">
            The UI is designed with a professional "dark mode" theme for clarity and reduced eye strain. The focus is on usability and quick information access.
        </p>
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold text-white text-sm mb-1">Live Dashboard</h4>
                <p className="text-zinc-400 text-xs">Features a real-time chart, granular controls for data streams, live signal logs for multiple timeframes, and panels for "Market Vitals" and "Market Sentiment". Signal cards are clickable to reveal a detailed rule breakdown.</p>
            </div>
            <div>
                <h4 className="font-semibold text-white text-sm mb-1">Backtesting Engine</h4>
                <p className="text-zinc-400 text-xs">The layout has been overhauled into a sleek, single-page design with a collapsible configuration panel at the top, allowing the entire page to scroll naturally. The results are organized into a professional, tab-based interface with dedicated views for the "Summary," "Equity Curve," "Price Chart," and a detailed "Trade Log."</p>
            </div>
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


const RecommendationsContent: React.FC = () => (
    <div className="space-y-4">
        <p className="text-zinc-400 text-xs">
            With the core rule engine and adaptive logic now complete and robust, the next evolution focuses on user control and adding external, real-world context.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                <h4 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-sliders mr-2 text-cyan-400"></i>User Control & Customization</h4>
                <ul className="list-disc list-inside text-zinc-400 space-y-2 text-xs">
                    <li><strong>UI for Strategy Configuration:</strong> The highest priority. Build a UI to allow direct editing of rule weights and parameters, empowering users to fine-tune and save their own strategies.</li>
                    <li><strong>Paper Trading Mode:</strong> Implement a simulated trading environment to test execution logic with zero risk.</li>
                </ul>
            </div>
            <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                <h4 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-shield-halved mr-2 text-cyan-400"></i>Advanced Risk & Execution</h4>
                <ul className="list-disc list-inside text-zinc-400 space-y-2 text-xs">
                     <li><strong>News & Event Awareness:</strong> Integrate an economic calendar API to put the engine in a "safe mode" during high-impact news.</li>
                     <li><strong>Dynamic Position Sizing:</strong> Automatically calculate optimal trade size based on account equity and volatility (ATR).</li>
                     <li><strong>Automated Trade Execution:</strong> Develop a module to place trades via broker API, including bracket orders.</li>
                </ul>
            </div>
            <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
                <h4 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-chart-pie mr-2 text-cyan-400"></i>Deeper Analytics</h4>
                <ul className="list-disc list-inside text-zinc-400 space-y-2 text-xs">
                    <li><strong>Time-of-Day Filtering:</strong> Use backtesting data to identify and trade only during the historically most profitable market sessions.</li>
                    <li><strong>Order Flow & Depth Analysis:</strong> Integrate Level 2 market depth data to analyze the order book for absorption.</li>
                </ul>
            </div>
        </div>
    </div>
);

const architectureSections = {
    'System Blueprint': { 'Blueprint': <SystemBlueprintContent /> },
    'System Design': { 'Trading Logic': <TradingLogicContent />, 'UI Design': <UIDesignContent />, 'Tech Stack': <TechStackContent /> },
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
