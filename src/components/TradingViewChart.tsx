import React, { useEffect, useRef, memo, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, LineStyle } from 'lightweight-charts';
import { useBroker } from '../contexts/BrokerContext';
import { runBacktest } from '../services/api';
import type { Signal, BacktestCandle, BacktestSignal } from '../types';

interface TradingViewChartProps {
  isLive: boolean;
  initialData?: BacktestCandle[];
  signals?: (Signal | BacktestSignal)[];
  backtestConfig?: { period: string; timeframe: string; instrument: string };
  onSignalClick?: (signal: BacktestSignal) => void;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ isLive, initialData, signals = [], backtestConfig, onSignalClick }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const [isLoading, setIsLoading] = useState(isLive); // Only show loading for live chart initial fetch

    const { lastTick } = useBroker();

    // Chart Creation and Cleanup
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: '#18181b' },
                textColor: '#a1a1aa',
            },
            grid: {
                vertLines: { color: '#27272a' },
                horzLines: { color: '#27272a' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#3f3f46',
            },
            crosshair: {
                mode: 1, // Magnet
                vertLine: { style: LineStyle.Dotted, color: '#a1a1aa' },
                horzLine: { style: LineStyle.Dotted, color: '#a1a1aa' },
            },
        });
        chartRef.current = chart;
        seriesRef.current = chart.addCandlestickSeries({
             upColor: '#22c55e',
             downColor: '#ef4444',
             borderDownColor: '#ef4444',
             borderUpColor: '#22c55e',
             wickDownColor: '#ef4444',
             wickUpColor: '#22c55e',
        });
        
        // Handle resizing
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });
        resizeObserver.observe(chartContainerRef.current);

        // Handle clicks
        if (onSignalClick) {
            chart.subscribeClick(param => {
                if (!param.time || !param.point || !signals) return;

                const clickedTime = param.time as UTCTimestamp;
                let closestSignal: BacktestSignal | null = null;
                let minTimeDiff = Infinity;

                (signals as BacktestSignal[]).forEach(signal => {
                    const signalTime = new Date(signal.time).getTime() / 1000 as UTCTimestamp;
                    const timeDiff = Math.abs(clickedTime - signalTime);
                    
                    if (timeDiff <= 300 && timeDiff < minTimeDiff) { // 5 min tolerance
                        minTimeDiff = timeDiff;
                        closestSignal = signal;
                    }
                });

                if (closestSignal) {
                    onSignalClick(closestSignal);
                }
            });
        }
        
        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [onSignalClick]);

    // Data Loading (Live and Backtest)
    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        const formatCandles = (candles: BacktestCandle[]) => {
            return candles.map(c => ({
                time: (new Date(c.date).getTime() / 1000) as UTCTimestamp,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));
        };

        if (isLive) {
            setIsLoading(true);
            const fetchInitialData = async () => {
                try {
                    const to = new Date();
                    const from = new Date();
                    from.setDate(to.getDate() - 2); // Fetch last 2 days for context
                    const result = await runBacktest({
                        instrument: 'BANKNIFTY',
                        period: '',
                        timeframe: '3m', // Default to 3m for live view
                        from: from.getTime() / 1000,
                        to: to.getTime() / 1000,
                        tradeExitStrategy: 'stop',
                    });
                    if (result.candles) {
                        series.setData(formatCandles(result.candles));
                    }
                } catch (error) {
                    console.error("Failed to fetch initial live data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        } else if (initialData) {
            series.setData(formatCandles(initialData));
            chartRef.current?.timeScale().fitContent();
        }
    }, [isLive, initialData]);

    // Live Tick Updates
    useEffect(() => {
        if (isLive && lastTick && seriesRef.current) {
            seriesRef.current.update({
                time: (new Date(lastTick.time).getTime() / 1000) as UTCTimestamp,
                close: lastTick.price,
            });
        }
    }, [isLive, lastTick]);
    
    // Signal Marker Updates
    useEffect(() => {
        const series = seriesRef.current;
        if (!series || signals.length === 0) return;

        const markers = signals.map(signal => ({
            time: (new Date(signal.time).getTime() / 1000) as UTCTimestamp,
            position: signal.direction.includes('BUY') ? 'belowBar' as const : 'aboveBar' as const,
            color: signal.direction.includes('BUY') ? '#22c55e' : '#ef4444',
            shape: signal.direction.includes('BUY') ? 'arrowUp' as const : 'arrowDown' as const,
            text: signal.direction.replace('_', ' '),
            size: 1,
        }));
        series.setMarkers(markers);

    }, [signals]);

     if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <p className="text-zinc-500 text-sm animate-pulse">Loading Chart Data...</p>
            </div>
        );
    }

    return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default memo(TradingViewChart);