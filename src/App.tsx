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
import ApiSpecification from './components/ApiSpecification';
import BrokerIntegration from './components/BrokerIntegration';
import BackendImplementation from './components/BackendImplementation';
import DeploymentGuide from './components/DeploymentGuide';
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
              This is a fully functional, end-to-end web application designed to generate real-time BUY/SELL trading signals for the BankNIFTY index. The system is architected for live market operation, leveraging Price Action Trading logic, processing live broker data, and persisting all signals to a database.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-lg text-green-400 mb-2">What's Completed?</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
                  <li><strong>Complete End-to-End Application:</strong> The frontend, backend server, and database are fully built and integrated.</li>
                  <li><strong>Live Broker Integration:</strong> The system connects directly to the Zerodha Kite API to process a real-time stream of market ticks.</li>
                  <li><strong>Stateful Trading Engine:</strong> The backend features a Price Action Engine that analyzes live data, builds candles, and applies trading rules.</li>
                  <li><strong>Database Persistence:</strong> All generated signals and user rule configurations are automatically saved to a PostgreSQL database for permanent storage and analysis.</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-lg text-orange-400 mb-2">Next Steps to Go-Live</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
                  <li><strong>Production Deployment:</strong> Deploy the full application stack (Frontend, Backend, Database) to a cloud server using the provided Docker guide.</li>
                  <li><strong>Live Monitoring & Alerting:</strong> Implement logging and monitoring tools (e.g., PM2, Sentry) to track the health of the live server and get alerts on any issues.</li>
                  <li><strong>Performance Tuning:</strong> After a period of live operation, analyze the generated signal data to fine-tune rule weights and logic for optimal performance.</li>
                  <li><strong>Historical Data Backfill:</strong> Populate the database with historical 1-minute candle data to enable more robust and extensive backtesting immediately.</li>
                </ul>
              </div>
            </div>
          </SectionCard>
        );
      case 'broker-integration':
        return <BrokerIntegration />;
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
      case 'api-specification':
        return <ApiSpecification />;
      case 'backend-implementation':
        return <BackendImplementation />;
      case 'deployment-guide':
        return <DeploymentGuide />;
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
      case 'recommendations':
        return (
          <SectionCard title={activeSectionData.title} iconClass={activeSectionData.iconClass}>
            <p className="text-gray-400 mb-4">With the core system now fully operational, future enhancements can focus on integrating more sophisticated data sources and analytical techniques to further increase signal accuracy and provide a deeper market understanding.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-3">
                <li><strong>Order Flow & Depth Analysis:</strong> Integrate Level 2 market depth data to analyze the order book. This allows for detecting hidden buying/selling pressure (e.g., iceberg orders) and provides a powerful leading indicator of price movement that pure price action misses.</li>
                <li><strong>Volatility Regime Filtering:</strong> Incorporate India VIX and historical volatility calculations as a dynamic filter. The system could automatically adjust its risk parameters—for example, widening stop-losses or seeking higher-conviction signals during periods of high volatility.</li>
                <li><strong>Automated Strategy Optimization:</strong> Use genetic algorithms or reinforcement learning to continuously run backtests in the background. The system could suggest optimal rule weights and parameters that adapt to changing market conditions.</li>
                <li><strong>Inter-market Correlation Analysis:</strong> Expand beyond global indices to analyze correlations with other key financial instruments like the USD/INR exchange rate and Indian 10-year bond yields, which can significantly impact the banking sector.</li>
                <li><strong>News Sentiment NLP:</strong> Integrate a real-time news feed API and use Natural Language Processing (NLP) to gauge the sentiment of breaking news related to the banking sector, adding it as a powerful qualitative rule in the engine.</li>
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
