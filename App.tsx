import React, { useState } from 'react';
import Header from './components/Header';
import SectionCard from './components/SectionCard';
import SignalCard from './components/SignalCard';
import RuleCard from './components/RuleCard';
import TechStackCard from './components/TechStackCard';
import MockupDashboard from './components/MockupDashboard';
import Sidebar from './components/Sidebar';
import LiveSignals from './components/LiveSignals';
import RuleCustomizer from './components/RuleCustomizer';
import MLIntegration from './components/MLIntegration';
import PredictiveML from './components/PredictiveML';
import Backtesting from './components/Backtesting';
import HowToRun from './components/HowToRun';
import { sections, tradingRules, frontendTech, backendTech, exampleSignal1, exampleSignal2 } from './constants';
import type { TradingRule, TechStackItem } from './types';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  const renderSectionContent = () => {
    const activeSectionData = sections.find(s => s.id === activeSection);
    if (!activeSectionData) {
      return <div className="text-center text-gray-500">Please select a section</div>;
    }

    switch (activeSection) {
      case 'overview':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 leading-relaxed mb-6">
              This is an interactive prototype for a sophisticated web application designed to generate real-time BUY/SELL trading signals for the BankNIFTY index. The system leverages Price Action Trading logic, analyzing the index and its 10 component bank stocks to provide traders with high-conviction, data-driven signals.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-lg text-green-400 mb-2">What's Completed?</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
                  <li><strong>Full UI/UX Prototype:</strong> An interactive and responsive user interface is fully designed.</li>
                  <li><strong>Feature Definition:</strong> All core features, from signal generation to backtesting, have been defined and mocked up.</li>
                  <li><strong>Component Architecture:</strong> The front-end is built with a modular, component-based structure using React.</li>
                   <li><strong>Interactive Simulators:</strong> Key modules like Live Signals, Backtesting, and Rule Customization are interactive.</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-lg text-orange-400 mb-2">Next Steps</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
                  <li><strong>Backend Development:</strong> Build the server-side logic, API endpoints, and WebSocket connections.</li>
                  <li><strong>Broker API Integration:</strong> Connect to Zerodha/Upstox to fetch live and historical market data.</li>
                  <li><strong>Database Implementation:</strong> Set up PostgreSQL/Redis to store signals and user configurations.</li>
                  <li><strong>ML Model Training:</strong> Develop and train the machine learning model for the "Smart Signals" feature.</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        );
      case 'live-signals':
        return <LiveSignals />;
      case 'functional-requirements':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li><strong>Real-time Signal Generation:</strong> Continuously process live market data to generate BUY, SELL, or NEUTRAL signals based on the Price Action Engine.</li>
              <li><strong>Clear User Interface:</strong> Display generated signals prominently with all relevant details for quick interpretation.</li>
              <li><strong>Active Notifications:</strong> Provide non-intrusive on-screen alerts for newly generated signals.</li>
              <li><strong>Signal Storage & History:</strong> Log all generated signals with timestamps and rule details for post-market analysis and user learning.</li>
              <li><strong>Market Sentiment Analysis:</strong> Display a real-time gauge of market sentiment derived from component stock data and options OI.</li>
            </ul>
          </SectionCard>
        );
      case 'data-sources':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 mb-3">The system requires real-time and historical data from a reliable broker API/WebSocket like Zerodha (Kite Connect) or Upstox.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li><strong>Live Data (WebSocket):</strong> Live ticks and 1/3 minute candlestick data for BankNIFTY index and its 10 component stocks.</li>
              <li><strong>Component Stocks:</strong> HDFC, ICICI, Axis, Kotak, SBI, IndusInd, Federal Bank, IDFC First, Bank of Baroda, AU Small Finance.</li>
              <li><strong>Historical & Pre-market Data (API):</strong> Previous day's High, Low, Close (fetched at 08:55 AM IST), Today’s Open.</li>
              <li><strong>Options Data:</strong> Real-time Open Interest (OI) data for BankNIFTY and component stocks.</li>
            </ul>
          </SectionCard>
        );
      case 'trading-logic':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 mb-4">The core Price Action Engine evaluates the market against a set of 12+ rules. A signal's conviction is calculated based on the percentage of rules passed. Here are the key rules:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tradingRules.map((rule: TradingRule) => (
                <RuleCard key={rule.title} title={rule.title} description={rule.description} />
              ))}
            </div>
          </SectionCard>
        );
       case 'rule-customizer':
        return <RuleCustomizer />;
      case 'ml-integration':
        return <MLIntegration />;
      case 'predictive-ml':
        return <PredictiveML />;
      case 'backtesting':
        return <Backtesting />;
      case 'signal-structure':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 mb-4">Each signal is structured for maximum clarity, providing all necessary information at a glance. Below are two examples:</p>
            <div className="flex flex-wrap gap-6 justify-center">
              <SignalCard signal={exampleSignal1} />
              <SignalCard signal={exampleSignal2} />
            </div>
          </SectionCard>
        );
      case 'ui-design':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 mb-4">The UI will be designed with a "dark mode" theme, common in trading platforms to reduce eye strain. The focus is on clarity, usability, and quick information access. Key elements include a dashboard with the latest signal, market sentiment, and a log of recent signals.</p>
            <MockupDashboard />
          </SectionCard>
        );
      case 'tech-stack':
        return (
            <div className="space-y-8">
              <SectionCard title="Front-end Technologies" iconClass="fa-brands fa-react">
                <p className="text-gray-400 mb-4">The front-end will be a modern, responsive Single Page Application (SPA) responsible for displaying data and notifications in real-time.</p>
                <div className="space-y-4">
                  {frontendTech.map((tech: TechStackItem) => (
                      <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} />
                    ))}
                </div>
              </SectionCard>
              <SectionCard title="Back-end Technologies" iconClass="fa-brands fa-node-js">
                <p className="text-gray-400 mb-4">The back-end is the engine of the application, handling data fetching, processing the trading logic, and pushing signals to the front-end.</p>
                <div className="space-y-4">
                  {backendTech.map((tech: TechStackItem) => (
                      <TechStackCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} />
                  ))}
                </div>
              </SectionCard>
            </div>
        );
      case 'sentiment-analysis':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 leading-relaxed">
              Market sentiment is judged by aggregating multiple factors in real-time. The application will analyze the alignment between the BankNIFTY index movement and the price action of its major weighted components (e.g., HDFC, ICICI). Strong positive sentiment is indicated when the index and key components are all showing bullish signs (e.g., breaking resistance). Divergence, where the index moves up but key components are weak, suggests poor sentiment and would lower signal conviction. This data, combined with Options OI, provides a robust, real-time sentiment gauge.
            </p>
          </SectionCard>
        );
      case 'feedback-mechanism':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 leading-relaxed">
              All generated signals are timestamped and stored in a database (e.g., PostgreSQL). The application will feature a "Historical Analysis" section where users can review past signals on a chart. For each signal, they can see which rules passed/failed and analyze the market conditions at that time. This creates a powerful feedback loop, allowing users to learn the logic, build trust in the system, and understand why certain signals performed well or poorly.
            </p>
          </SectionCard>
        );
      case 'how-to-run':
        return <HowToRun />;
      case 'recommendations':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 mb-4">With the core, backtesting, and predictive ML features designed, the platform has a strong foundation. Future enhancements could focus on deeper data integration and user experience:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-3">
              <li><strong>Automated Strategy Optimization:</strong> Develop an ML agent that runs backtests in the background and suggests optimal weights for the rule customizer based on which configurations have performed best historically.</li>
              <li><strong>News Sentiment Analysis:</strong> Integrate a real-time news feed API (e.g., Thomson Reuters, Bloomberg) and use Natural Language Processing (NLP) to gauge the sentiment of breaking news related to the banking sector, adding it as a rule in the engine.</li>
              <li><strong>Global Market Correlation:</strong> Factor in the performance of key global indices (e.g., S&P 500, DAX) as a filter, as they often influence opening trends in the Indian market.</li>
              <li><strong>Community & Social Features:</strong> Allow users to share their custom rule configurations (without sharing live trades), comment on historical signals, and build a community around the tool to share insights.</li>
            </ul>
          </SectionCard>
        );
      default:
        return null;
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-200 font-sans antialiased flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar sections={sections} activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-900">
          <div className="w-full max-w-7xl mx-auto">
            {renderSectionContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;