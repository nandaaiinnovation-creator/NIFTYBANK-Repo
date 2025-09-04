import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Watchlist from './components/Watchlist';
import Backtesting from './components/Backtesting';
import Dashboard from './components/Dashboard';
import MLIntelligence from './components/MLIntelligence';
import SystemArchitecture from './components/SystemArchitecture';
import { sections } from './constants';
import BrokerConnectModal from './components/BrokerConnectModal';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
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
    <div className="h-screen bg-zinc-900 text-gray-300 font-sans antialiased flex flex-col">
      <BrokerConnectModal />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Watchlist activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 p-2 overflow-y-auto">
          {renderSectionContent()}
        </main>
      </div>
    </div>
  );
};

export default App;