import React from 'react';
import type { Section } from '../types';

interface SidebarProps {
  sections: Section[];
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, activeSection, setActiveSection }) => {
  return (
    <aside className="w-20 bg-gray-800 p-2 flex flex-col items-center space-y-2 flex-shrink-0 border-r border-gray-700 overflow-y-auto">
      <nav className="w-full">
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                title={section.title}
                className={`w-full h-14 flex items-center justify-center rounded-lg transition-colors duration-200 group relative ${
                  activeSection === section.id
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                <i className={`${section.iconClass} text-2xl`}></i>
                <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-gray-700">
                  {section.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
