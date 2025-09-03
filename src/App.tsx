import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Backtesting from './components/Backtesting';
import { sections } from './constants';
import TradingTerminal from './components/TradingTerminal';
import MLIntelligence from './components/MLIntelligence';
import SystemArchitecture from './components/SystemArchitecture';


const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'trading-terminal':
        return <TradingTerminal />;
      case 'backtesting':
        return <Backtesting />;
      case 'ml-intelligence':
        return <MLIntelligence />;
      case 'system-architecture':
        return <SystemArchitecture />;
      default:
        return <div className="text-center text-gray-500">Please select a section</div>;
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
