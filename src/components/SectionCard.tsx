import React from 'react';

interface SectionCardProps {
  title: string;
  iconClass: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, iconClass, children }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex items-center mb-4">
        <i className={`${iconClass} text-xl text-cyan-400 mr-3`}></i>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;
