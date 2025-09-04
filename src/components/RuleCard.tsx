import React from 'react';
import type { TradingRule } from '../types';

const RuleCard: React.FC<TradingRule> = ({ title, description }) => {
  return (
    <div className="bg-zinc-950 p-2 border border-zinc-800 rounded-sm hover:bg-zinc-800 transition-colors duration-200">
      <h3 className="font-semibold text-white text-xs mb-1">{title}</h3>
      <p className="text-zinc-400 text-xs">{description}</p>
    </div>
  );
};

export default RuleCard;