import React from 'react';
import type { TradingRule } from '../types';

const RuleCard: React.FC<TradingRule> = ({ title, description }) => {
  return (
    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors duration-200">
      <h3 className="font-semibold text-white text-md mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default RuleCard;
