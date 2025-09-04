import React from 'react';
import type { TechStackItem } from '../types';

const TechStackCard: React.FC<TechStackItem> = ({ name, description, icon }) => {
  return (
    <div className="flex items-start bg-zinc-950 p-2 border border-zinc-800 rounded-sm">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm bg-zinc-800 mr-3">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white text-sm">{name}</h3>
        <p className="text-zinc-400 text-xs">{description}</p>
      </div>
    </div>
  );
};

export default TechStackCard;