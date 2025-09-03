import React from 'react';
import type { TechStackItem } from '../types';

const TechStackCard: React.FC<TechStackItem> = ({ name, description, icon }) => {
  return (
    <div className="flex items-start bg-gray-900 p-4 rounded-md">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 mr-4">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{name}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default TechStackCard;
