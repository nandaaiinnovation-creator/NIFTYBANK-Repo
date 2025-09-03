import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Signal } from '../types';
import { SignalDirection } from '../types';
import SignalCard from './SignalCard';

const timeIntervals = [
  { label: '1 Min', value: 1 },
  { label: '3 Min', value: 3 },
  { label: '5 Min', value: 5 },
];

const generateRandomSignal = (): Signal => {
  const direction = Math.random() > 0.5 ? SignalDirection.BUY : SignalDirection.SELL;
  const price = 54000 + Math.floor(Math.random() * 500) - 250;
  const conviction = Math.floor(Math.random() * 40) + 60; // 60-100%
  const allRules = ["PrevDayLevels", "SupportResistance", "InitialBalanceBreakout", "Momentum", "OIData", "Volume Analysis", "Market Structure"];
  const passedCount = Math.floor(Math.random() * 4) + 2; // 2-5 rules passed
  const rulesPassed = [...allRules].sort(() => 0.5 - Math.random()).slice(0, passedCount);
  const rulesFailed = [...allRules].sort(() => 0.5 - Math.random()).slice(0, 2);

  return {
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    symbol: 'BANKNIFTY',
    price: price,
    direction: direction,
    rulesPassed: rulesPassed,
    rulesFailed: rulesFailed,
    conviction: conviction,
  };
};

const LiveSignals: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedInterval, setSelectedInterval] = useState<number>(3);
  const [signals, setSignals] = useState<Signal[]>([]);
  // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopGenerating = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startGenerating = useCallback(() => {
    stopGenerating(); // Ensure no multiple intervals are running
    intervalRef.current = setInterval(() => {
      setSignals(prevSignals => [generateRandomSignal(), ...prevSignals.slice(0, 19)]); // Keep last 20 signals
    }, selectedInterval * 2000); // Using a faster interval for demonstration
  }, [selectedInterval, stopGenerating]);

  useEffect(() => {
    if (isGenerating) {
      startGenerating();
    } else {
      stopGenerating();
    }
    return () => stopGenerating(); // Cleanup on component unmount
  }, [isGenerating, startGenerating, stopGenerating]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
            <i className="fa-solid fa-tower-broadcast text-xl text-cyan-400 mr-3"></i>
            <h2 className="text-xl font-semibold text-white">Live Signal Generator</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Interval Selection */}
            <div className="flex items-center bg-gray-900 rounded-md p-1">
                <span className="text-sm text-gray-400 px-2 hidden sm:block">Interval:</span>
                {timeIntervals.map(interval => (
                    <button
                        key={interval.value}
                        onClick={() => setSelectedInterval(interval.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            selectedInterval === interval.value
                                ? 'bg-cyan-500 text-white shadow'
                                : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {interval.label}
                    </button>
                ))}
            </div>

            {/* Start/Stop Button */}
            <button
                onClick={() => setIsGenerating(!isGenerating)}
                className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 ${
                    isGenerating
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
                {isGenerating ? (
                    <><i className="fas fa-stop-circle animate-pulse"></i> Stop</>
                ) : (
                    <><i className="fas fa-play-circle"></i> Start</>
                )}
            </button>
        </div>
      </div>

      {/* Signals Display */}
      <div className="h-[60vh] overflow-y-auto pr-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <i className="fas fa-satellite-dish text-5xl mb-4"></i>
            <p className="text-lg">Waiting for signals...</p>
            <p className="text-sm">
                {isGenerating ? 'Generator is running...' : 'Press "Start" to begin receiving live signals.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal, index) => (
              <SignalCard key={`${signal.time}-${index}`} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSignals;