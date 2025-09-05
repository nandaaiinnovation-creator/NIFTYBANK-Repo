import React, { useEffect, useRef, memo, useState } from 'react';
// FIX: Swapped UTCTimestamp for Time to resolve type conflicts with older lightweight-charts versions.
// FIX: Use the specific ICandlestickSeriesApi interface to ensure methods like addCandlestickSeries and setMarkers are available.
import { createChart, IChartApi, ICandlestickSeriesApi, Time, LineStyle, CandlestickData, SeriesMarker } from 'lightweight-charts';
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

const TradingViewChart: React.FC<TradingViewChartProps> = ({ isLive, initialData, signals = [], onSignalClick }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    // FIX: Use the more specific ICandlestickSeriesApi type for better type inference and method availability.
    const seriesRef = useRef<ICandlestickSeriesApi | null>(null);
    const [isLoading, setIsLoading] = useState(isLive);

    const { lastTick } = useBroker();

    // Chart Initialization and Cleanup
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: '#18181b' }, // zinc-900
                textColor: '#a1a1aa', // zinc-400
            },
            grid: {
                vertLines: { color: '#27272a' }, // zinc-800
                horzLines: { color: '#27272a' }, // zinc-800
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#3f3f46', // zinc-700
            },
            crosshair: {
                mode: 1, // Magnet
                vertLine: { style: LineStyle.Dotted, color: '#a1a1aa' },
                horzLine: { style: LineStyle.Dotted, color: '#a1a1aa' },
            },
        });
        chartRef.current = chart;
        seriesRef.current = chart.addCandlestickSeries({
             upColor: '#22c55e', // green-500
             downColor: '#ef4444', // red-500
             borderDownColor: '#ef4444',
             borderUpColor: '#22c55e',
             wickDownColor: '#ef4444',
             wickUpColor: '#22c55e',
        });
        
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
            const { width, height } = entries[0].contentRect;
            chart.applyOptions({ width, height });
        });
        resizeObserver.observe(chartContainerRef.current);

        if (onSignalClick) {
            chart.subscribeClick(param => {
                if (!param.time || !param.point || !signals || signals.length === 0) return;

                const clickedTime = param.time as number; // Treat as numeric timestamp
                let closestSignal: BacktestSignal | null = null;
                let minTimeDiff = Infinity;

                (signals as BacktestSignal[]).forEach(signal => {
                    const signalTime = new Date(signal.time).getTime() / 1000; // This is already a number
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
            if (chartRef.current) {
                chartRef.current.remove();
            }
        };
    }, [onSignalClick, signals]);

    // Data Loading (Live and Backtest)
    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        const formatCandles = (candles: BacktestCandle[]): CandlestickData[] => {
            return candles.map(c => ({
                // FIX: Cast to Time instead of UTCTimestamp
                time: (new Date(c.date).getTime() / 1000) as Time,
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
                    from.setDate(to.getDate() - 2); 
                    const result = await runBacktest({
                        instrument: 'BANKNIFTY',
                        period: '',
                        timeframe: '3m',
                        from: from.getTime(),
                        to: to.getTime(),
                        tradeExitStrategy: 'stop',
                    });
                    if (result.candles && result.candles.length > 0) {
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
            if(initialData.length > 0) {
              series.setData(formatCandles(initialData));
              chartRef.current?.timeScale().fitContent();
            } else {
              series.setData([]);
            }
        }
    }, [isLive, initialData]);

    // Live Tick Updates
    useEffect(() => {
        if (isLive && lastTick && seriesRef.current) {
            seriesRef.current.update({
                // FIX: Cast to Time instead of UTCTimestamp
                time: (new Date(lastTick.time).getTime() / 1000) as Time,
                close: lastTick.price,
            });
        }
    }, [isLive, lastTick]);
    
    // Signal Marker Updates
    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        if (signals.length === 0) {
            series.setMarkers([]);
            return;
        }

        // FIX: Use Time generic for SeriesMarker
        const markers: SeriesMarker<Time>[] = signals.map(signal => ({
            // FIX: Cast to Time instead of UTCTimestamp
            time: (new Date(signal.time).getTime() / 1000) as Time,
            position: signal.direction.includes('BUY') ? 'belowBar' : 'aboveBar',
            color: signal.direction.includes('BUY') ? '#22c55e' : '#ef4444',
            shape: signal.direction.includes('BUY') ? 'arrowUp' : 'arrowDown',
            text: signal.direction.replace('_', ' '),
            size: 1,
        }));
        series.setMarkers(markers);

    }, [signals]);

    if (isLoading && isLive) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <p className="text-zinc-500 text-sm animate-pulse">Loading Live Chart Data...</p>
            </div>
        );
    }

    return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default memo(TradingViewChart);