import React, { useState, useEffect, useCallback } from 'react';
import SectionCard from './SectionCard';
import SignalCard from './SignalCard';
import type { Signal, TradingRule } from '../types';
import { SignalDirection } from '../types';
import { startLiveSignalStream, stopLiveSignalStream, saveRuleConfiguration } from '../services/api';
import { useBroker } from '../contexts/BrokerContext';
import { tradingRules } from '../constants';


// --- BROKER CONNECTION COMPONENT ---
const BrokerConnectionBar: React.FC = () => {
    const { status, message, apiKey, setApiKey, accessToken, setAccessToken, connect, disconnect } = useBroker();
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);
        try {
            await connect();
        } catch (error) {
            console.error("Connection attempt failed from component.");
        } finally {
            setIsConnecting(false);
        }
    };
    
    const StatusIndicator = () => {
        switch (status) {
            case 'connected': return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
            case 'connecting': return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
            case 'error': return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
            default: return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
        }
    };
    
    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <StatusIndicator />
                    <div className="flex flex-col">
                        <span className="font-semibold text-white">Broker Connection</span>
                        <span className="text-xs text-gray-400">{message}</span>
                    </div>
                </div>

                {status !== 'connected' ? (
                     <form onSubmit={handleConnect} className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="API Key"
                            className="w-full sm:w-40 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            required
                        />
                         <input
                            type="password"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="Access Token"
                            className="w-full sm:w-40 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            required
                        />
                        <button type="submit" disabled={isConnecting} className="w-full sm:w-auto px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md text-sm hover:bg-cyan-700 disabled:bg-gray-500 transition-colors">
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    </form>
                ) : (
                    <button onClick={disconnect} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md text-sm hover:bg-red-700 transition-colors">
                        Disconnect
                    </button>
                )}
            </div>
        </div>
    );
};


// --- LIVE SIGNALS COMPONENT ---
interface ChartSignal extends Signal { id: string; x: number; y: number; }
interface Candle { id: number; open: number; high: number; low: number; close: number; }
const MAX_CANDLES = 25;

const LiveSignalsContent: React.FC = () => {
  const { status: brokerStatus } = useBroker();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [chartSignals, setChartSignals] = useState<ChartSignal[]>([]);
  const [candlesticks, setCandlesticks] = useState<Candle[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });

  const generateInitialCandles = useCallback(() => {
    let price = 54000;
    const initialCandles: Candle[] = [];
    for (let i = 0; i < MAX_CANDLES; i++) {
        const open = price;
        const change = (Math.random() - 0.5) * 100;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        initialCandles.push({ id: i, open, high, low, close });
        price = close;
    }
    setCandlesticks(initialCandles);
  }, []);

  useEffect(() => { generateInitialCandles(); }, [generateInitialCandles]);

  useEffect(() => {
    if (candlesticks.length === 0) return;
    const lows = candlesticks.map(c => c.low);
    const highs = candlesticks.map(c => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    setPriceRange({ min, max });
  }, [candlesticks]);


  const handleNewSignal = useCallback((newSignal: Signal) => {
    setSignals(prevSignals => [newSignal, ...prevSignals.slice(0, 19)]);
    setCandlesticks(prevCandles => {
        if (prevCandles.length === 0) return [];
        const updatedCandles = prevCandles.slice(1);
        const lastCandle = { ...updatedCandles[updatedCandles.length - 1] };
        lastCandle.close = newSignal.price;
        lastCandle.high = Math.max(lastCandle.high, newSignal.price);
        lastCandle.low = Math.min(lastCandle.low, newSignal.price);
        updatedCandles[updatedCandles.length - 1] = lastCandle;
        return updatedCandles;
    });

    if (priceRange.max > priceRange.min) {
        const range = priceRange.max - priceRange.min;
        const y = ((newSignal.price - priceRange.min) / range) * 100;
        const chartSignal: ChartSignal = { ...newSignal, id: `${newSignal.time}-${newSignal.price}`, x: 95, y: Math.max(5, Math.min(95, y)), }
        setChartSignals(prevChartSignals => [...prevChartSignals.slice(-9), chartSignal]);
    }
  }, [priceRange]);

  useEffect(() => {
    if (isGenerating) {
      startLiveSignalStream(handleNewSignal);
    } else {
      stopLiveSignalStream();
    }
    return () => stopLiveSignalStream();
  }, [isGenerating, handleNewSignal]);
  
  const toggleGenerator = () => {
      if (brokerStatus !== 'connected') {
          alert("Please connect to the broker first.");
          return;
      }
      if (!isGenerating) {
          setSignals([]);
          setChartSignals([]);
          generateInitialCandles();
      }
      setIsGenerating(!isGenerating);
  }

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Live Signal Dashboard</h2>
        <button
            onClick={toggleGenerator}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 ${isGenerating ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`} >
            {isGenerating ? <><i className="fas fa-stop-circle animate-pulse"></i> Stop</> : <><i className="fas fa-play-circle"></i> Start</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
            <h3 className="text-md font-semibold text-white mb-2">BANKNIFTY Chart</h3>
            <p className="text-xs text-gray-500 mb-4">Visual mockup of live data feed.</p>
            <div className="relative flex-grow bg-gray-800 rounded-md p-2 overflow-hidden">
                <div className="absolute top-0 right-2 h-full flex flex-col justify-between py-1 text-xs text-gray-500 z-10">
                    <span>{priceRange.max.toFixed(0)}</span>
                    <span>{(priceRange.min + (priceRange.max - priceRange.min) / 2).toFixed(0)}</span>
                    <span>{priceRange.min.toFixed(0)}</span>
                </div>
                {candlesticks.map((candle, index) => {
                    const range = priceRange.max - priceRange.min;
                    if (range <= 0) return null;
                    const isGreen = candle.close >= candle.open;
                    const bodyTop = Math.max(candle.open, candle.close);
                    const bodyBottom = Math.min(candle.open, candle.close);
                    const bodyHeight = ((bodyTop - bodyBottom) / range) * 100;
                    const bodyBottomPos = ((bodyBottom - priceRange.min) / range) * 100;
                    const wickHeight = ((candle.high - candle.low) / range) * 100;
                    const wickBottomPos = ((candle.low - priceRange.min) / range) * 100;
                    return (
                        <div key={candle.id} className="absolute h-full" style={{ left: `${(index / MAX_CANDLES) * 100}%`, width: `${100 / MAX_CANDLES}%` }}>
                            <div className="absolute bg-gray-500 mx-auto left-0 right-0" style={{ bottom: `${wickBottomPos}%`, height: `${Math.max(0, wickHeight)}%`, width: '2px' }}></div>
                            <div className={`absolute mx-auto left-0 right-0 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`} style={{ bottom: `${bodyBottomPos}%`, height: `${Math.max(0, bodyHeight)}%`, width: '60%' }}></div>
                        </div>
                    );
                })}
                {chartSignals.map((signal) => (
                    <div key={signal.id} className="absolute transition-all duration-500 ease-out animate-fade-in" style={{ left: `${signal.x}%`, bottom: `${signal.y}%`, transform: 'translateX(-50%)' }}>
                        <div className={`flex items-center gap-1 ${signal.direction === SignalDirection.BUY ? 'flex-col' : 'flex-col-reverse'}`}>
                            <div className={`p-1.5 rounded-md text-white text-xs font-bold shadow-lg ${signal.direction === SignalDirection.BUY ? 'bg-green-600' : 'bg-red-600'}`}>{signal.price}</div>
                            <i className={`fa-solid ${signal.direction === SignalDirection.BUY ? 'fa-caret-up text-green-400' : 'fa-caret-down text-red-400'} text-2xl`}></i>
                        </div>
                    </div>
                ))}
            </div>
          </div>
          <div className="lg:col-span-1 h-full overflow-y-auto pr-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-md font-semibold text-white mb-4">Recent Signals</h3>
            {signals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <i className="fas fa-satellite-dish text-5xl mb-4"></i>
                <p className="text-lg">Waiting for signals...</p>
                <p className="text-sm mt-2">{isGenerating ? 'Generator is running...' : 'Press "Start" to begin.'}</p>
              </div>
            ) : ( <div className="space-y-4">{signals.map((signal, index) => (<SignalCard key={`${signal.time}-${index}`} signal={signal} />))}</div> )}
          </div>
      </div>
    </div>
  );
};


// --- RULE CUSTOMIZER COMPONENT ---
export interface CustomizableRule extends TradingRule { isActive: boolean; weight: number; }
const initialRules: CustomizableRule[] = tradingRules.map(rule => ({...rule, isActive: true, weight: 1.0, }));

const RuleCustomizerContent: React.FC = () => {
  const [rules, setRules] = useState<CustomizableRule[]>(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const handleToggle = (title: string) => setRules(rules.map(rule => rule.title === title ? { ...rule, isActive: !rule.isActive } : rule));
  const handleWeightChange = (title: string, newWeight: number) => setRules(rules.map(rule => rule.title === title ? { ...rule, weight: newWeight } : rule));
  const handleReset = () => setRules(initialRules);

  const handleSave = async () => {
      setIsSaving(true);
      setSaveStatus('idle');
      try {
          await saveRuleConfiguration(rules);
          setSaveStatus('success');
      } catch (error) {
          console.error("Failed to save configuration:", error);
      } finally {
          setIsSaving(false);
          setTimeout(() => setSaveStatus('idle'), 2500);
      }
  }

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-xl p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
                 <h2 className="text-xl font-semibold text-white">Rule Engine Customizer</h2>
                 <p className="text-gray-400 mt-1 text-sm">Tailor the signal logic by enabling, disabling, or weighting rules.</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
                <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"><i className="fas fa-undo mr-2"></i>Reset</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors disabled:bg-gray-500 w-32 text-center">
                    {isSaving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : saveStatus === 'success' ? <><i className="fas fa-check-circle mr-2"></i>Saved!</> : <><i className="fas fa-save mr-2"></i>Save</>}
                </button>
            </div>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <div key={rule.title} className={`p-4 rounded-lg border transition-all duration-300 ${rule.isActive ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/50 border-gray-700/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold text-md transition-colors ${rule.isActive ? 'text-white' : 'text-gray-500'}`}>{rule.title}</h3>
              <label htmlFor={`toggle-${rule.title}`} className="flex items-center cursor-pointer">
                  <div className="relative">
                      <input id={`toggle-${rule.title}`} type="checkbox" className="sr-only" checked={rule.isActive} onChange={() => handleToggle(rule.title)} />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${rule.isActive ? 'bg-cyan-500' : 'bg-gray-600'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${rule.isActive ? 'transform translate-x-6' : ''}`}></div>
                  </div>
              </label>
            </div>
            <p className={`text-sm mb-4 transition-colors ${rule.isActive ? 'text-gray-400' : 'text-gray-600'}`}>{rule.description}</p>
            <div className={`transition-opacity ${rule.isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <label htmlFor={`slider-${rule.title}`} className="block text-sm font-medium text-gray-400 mb-1">Weight: <span className="font-bold text-white">{rule.weight.toFixed(1)}x</span></label>
                <input id={`slider-${rule.title}`} type="range" min="0.5" max="1.5" step="0.1" value={rule.weight} onChange={(e) => handleWeightChange(rule.title, parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" disabled={!rule.isActive} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- MAIN TRADING TERMINAL COMPONENT ---
const TradingTerminal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'live' | 'rules'>('live');

    const TabButton: React.FC<{ tabName: 'live' | 'rules', children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === tabName ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-white'}`}
        >
            {children}
        </button>
    );

    return (
        <SectionCard title="Trading Terminal" iconClass="fa-solid fa-desktop">
            <BrokerConnectionBar />

            <div className="border-b border-gray-700">
                <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    <TabButton tabName="live"><i className="fas fa-tower-broadcast mr-2"></i>Live Signals</TabButton>
                    <TabButton tabName="rules"><i className="fas fa-sliders mr-2"></i>Rule Customizer</TabButton>
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'live' && <LiveSignalsContent />}
                {activeTab === 'rules' && <RuleCustomizerContent />}
            </div>
        </SectionCard>
    );
};

export default TradingTerminal;
