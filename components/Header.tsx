
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-5 flex items-center">
        <i className="fa-solid fa-chart-pie text-3xl text-cyan-400 mr-4"></i>
        <div>
          <h1 className="text-2xl font-bold text-white">BankNIFTY Trading Signal Architect</h1>
          <p className="text-sm text-gray-400">System Design & Technical Specification</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
