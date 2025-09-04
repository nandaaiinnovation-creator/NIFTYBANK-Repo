import React from 'react';

interface SectionCardProps {
  title: string;
  iconClass: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, iconClass, children }) => {
  return (
    <div className="bg-zinc-800 p-2 border border-zinc-700">
      <div className="flex items-center mb-3">
        <i className={`${iconClass} text-lg text-cyan-400 mr-3`}></i>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;