import React, { useState } from 'react';
import SectionCard from './SectionCard';
import { tradingRules } from '../constants';
import type { TradingRule } from '../types';
import { saveRuleConfiguration } from '../services/api';

export interface CustomizableRule extends TradingRule {
  isActive: boolean;
  weight: number;
}

const initialRules: CustomizableRule[] = tradingRules.map(rule => ({
  ...rule,
  isActive: true,
  weight: 1.0,
}));

const RuleCustomizer: React.FC = () => {
  const [rules, setRules] = useState<CustomizableRule[]>(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const handleToggle = (title: string) => {
    setRules(rules.map(rule => 
      rule.title === title ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const handleWeightChange = (title: string, newWeight: number) => {
    setRules(rules.map(rule => 
      rule.title === title ? { ...rule, weight: newWeight } : rule
    ));
  };

  const handleReset = () => {
      setRules(initialRules);
  }

  const handleSave = async () => {
      setIsSaving(true);
      setSaveStatus('idle');
      try {
          await saveRuleConfiguration(rules);
          setSaveStatus('success');
      } catch (error) {
          console.error("Failed to save configuration:", error);
          // Optionally, set an error status to show in the UI
      } finally {
          setIsSaving(false);
          setTimeout(() => setSaveStatus('idle'), 2500); // Reset status after 2.5s
      }
  }

  return (
    <SectionCard title="Rule Engine Customizer" iconClass="fa-solid fa-sliders">
        <p className="text-gray-400 mb-4">
            Tailor the signal generation logic to your personal trading style. Enable or disable rules, and adjust their individual weight in the conviction calculation. Higher weights give a rule more importance.
        </p>
        <div className="flex justify-end gap-3 mb-4">
            <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                <i className="fas fa-undo mr-2"></i>Reset to Defaults
            </button>
            <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed w-40 text-center"
            >
                {isSaving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : 
                 saveStatus === 'success' ? <><i className="fas fa-check-circle mr-2"></i>Saved!</> :
                 <><i className="fas fa-save mr-2"></i>Save Configuration</>}
            </button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div key={rule.title} className={`p-4 rounded-lg border transition-all duration-300 ${rule.isActive ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/50 border-gray-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold text-md transition-colors ${rule.isActive ? 'text-white' : 'text-gray-500'}`}>{rule.title}</h3>
              <div className="flex items-center">
                <label htmlFor={`toggle-${rule.title}`} className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input id={`toggle-${rule.title}`} type="checkbox" className="sr-only" checked={rule.isActive} onChange={() => handleToggle(rule.title)} />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${rule.isActive ? 'bg-cyan-500' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${rule.isActive ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                </label>
              </div>
            </div>
            <p className={`text-sm mb-4 transition-colors ${rule.isActive ? 'text-gray-400' : 'text-gray-600'}`}>{rule.description}</p>
            <div className={`transition-opacity ${rule.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <label htmlFor={`slider-${rule.title}`} className="block text-sm font-medium text-gray-400 mb-1">
                    Weight: <span className="font-bold text-white">{rule.weight.toFixed(1)}x</span>
                </label>
                <input 
                    id={`slider-${rule.title}`}
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1" 
                    value={rule.weight}
                    onChange={(e) => handleWeightChange(rule.title, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    disabled={!rule.isActive}
                />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default RuleCustomizer;
