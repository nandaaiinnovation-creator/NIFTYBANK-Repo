import React, { useEffect, useRef, memo, useState } from 'react';
import { useBroker } from '../contexts/BrokerContext';
import { runBacktest } from '../services/api';
import type { Signal, BacktestCandle, BacktestSignal } from '../types';
import { SignalDirection } from '../types';

declare const TradingView: any;

interface TradingViewChartProps {
  isLive: boolean;
  initialData?: BacktestCandle[];
  signals?: (Signal | BacktestSignal)[];
}

const datafeed = (isLive: boolean, lastTickRef: React.MutableRefObject<any>, initialData?: BacktestCandle[]) => ({
    onReady: (callback: Function) => {
        console.log('[Datafeed] onReady called');
        setTimeout(() => callback({ supported_resolutions: ['1', '3', '5', '15'] }), 0);
    },
    searchSymbols: () => {},
    resolveSymbol: (symbolName: string, onSymbolResolvedCallback: Function) => {
        console.log('[Datafeed] resolveSymbol called:', symbolName);
        const symbolInfo = {
            name: 'BANKNIFTY',
            ticker: 'BANKNIFTY',
            description: 'NIFTY BANK',
            session: '0915-1530',
            timezone: 'Asia/Kolkata',
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            has_no_volume: false,
            supported_resolutions: ['1', '3', '5', '15'],
        };
        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    },
    getBars: async (
        symbolInfo: any, 
        resolution: string, 
        periodParams: { from: number; to: number; firstDataRequest: boolean },
        onHistoryCallback: Function,
        onErrorCallback: Function
    ) => {
        const { from, to, firstDataRequest } = periodParams;
        console.log(`[Datafeed] getBars called for ${resolution} from ${new Date(from * 1000)} to ${new Date(to * 1000)}`);
        
        if (!isLive && initialData) {
            console.log('[Datafeed] Using pre-loaded backtest data.');
            const bars = initialData.map(c => ({
                time: new Date(c.date).getTime(),
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));
            onHistoryCallback(bars, { noData: bars.length === 0 });
            return;
        }

        try {
            const results = await runBacktest({ 
                period: '', 
                timeframe: `${resolution}m`, 
                from, 
                to 
            });
            const bars = results.candles.map(c => ({
                time: new Date(c.date).getTime(),
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));
            onHistoryCallback(bars, { noData: bars.length === 0 });
        } catch (error) {
            console.error('[Datafeed] Error fetching history:', error);
            onErrorCallback(error);
        }
    },
    subscribeBars: (
        symbolInfo: any, 
        resolution: string, 
        onRealtimeCallback: Function, 
        subscriberUID: string,
    ) => {
        if (!isLive) return;
        console.log('[Datafeed] subscribeBars called for', subscriberUID);
        lastTickRef.current.callback = onRealtimeCallback;
    },
    unsubscribeBars: (subscriberUID: string) => {
        if (!isLive) return;
        console.log('[Datafeed] unsubscribeBars called for', subscriberUID);
        lastTickRef.current.callback = null;
    },
});

const TradingViewChart: React.FC<TradingViewChartProps> = ({ isLive, initialData, signals = [] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const { lastTick } = useBroker();
    const lastTickRef = useRef<any>({ tick: null, callback: null });
    const [libraryStatus, setLibraryStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

    useEffect(() => {
        lastTickRef.current.tick = lastTick;
        if (lastTickRef.current.callback && lastTick) {
             lastTickRef.current.callback({
                time: new Date(lastTick.time).getTime(),
                close: lastTick.price,
            });
        }
    }, [lastTick]);

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds timeout (50 * 100ms)

        const checkForLibrary = () => {
            if (typeof TradingView !== 'undefined') {
                setLibraryStatus('ready');
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkForLibrary, 100);
                } else {
                    console.warn("TradingView Charting Library not found. This is expected if the library is not installed. The chart will be replaced by a placeholder.");
                    setLibraryStatus('missing');
                }
            }
        };

        checkForLibrary();
    }, []);

    useEffect(() => {
        if (libraryStatus !== 'ready' || !chartContainerRef.current) {
            return;
        }

        const widgetOptions = {
            symbol: 'BANKNIFTY',
            datafeed: datafeed(isLive, lastTickRef, initialData),
            interval: '3',
            container: chartContainerRef.current,
            library_path: '/charting_library/',
            locale: 'en',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: ['study_templates'],
            charts_storage_url: 'https://saveload.tradingview.com',
            charts_storage_api_version: '1.1',
            client_id: 'tradingview.com',
            user_id: 'public_user_id',
            fullscreen: false,
            autosize: true,
            theme: 'dark',
            overrides: {
                "paneProperties.background": "#18181b", // zinc-900
                "paneProperties.vertGridProperties.color": "#27272a", // zinc-800
                "paneProperties.horzGridProperties.color": "#27272a", // zinc-800
                "scalesProperties.textColor": "#a1a1aa", // zinc-400
            },
        };

        const tvWidget = new TradingView.widget(widgetOptions);
        chartRef.current = tvWidget;

        tvWidget.onChartReady(() => {
            console.log("Chart is ready");
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [libraryStatus, isLive, initialData]);


    const drawSignalsOnChart = (signalsToDraw: (Signal | BacktestSignal)[]) => {
        if (!chartRef.current || !chartRef.current.chart) return;
        
        const chart = chartRef.current.chart();
        chart.removeAllShapes(); // Clear previous signals

        signalsToDraw.forEach(signal => {
            const time = new Date(signal.time).getTime() / 1000;
            const isBuy = signal.direction === SignalDirection.BUY;
            
            const shapeOptions = {
                shape: isBuy ? 'arrow_up' as const : 'arrow_down' as const,
                time: time,
                price: signal.price,
                color: isBuy ? '#22c55e' : '#ef4444',
                size: 2,
            };
            
            if ('candleIndex' in signal && signal.candleIndex !== undefined && initialData) {
                 const candle = initialData[signal.candleIndex];
                 if (candle) {
                     shapeOptions.time = new Date(candle.date).getTime() / 1000;
                 }
            }

            chart.createShape(shapeOptions);
        });
    };

    useEffect(() => {
        if (libraryStatus === 'ready' && chartRef.current && chartRef.current.chart()) {
            drawSignalsOnChart(signals);
        }
    }, [signals, libraryStatus]);

    if (libraryStatus === 'loading') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <p className="text-zinc-500 text-sm animate-pulse">Loading Chart...</p>
            </div>
        );
    }
    
    if (libraryStatus === 'missing') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 p-4 text-center">
                <i className="fas fa-chart-line text-4xl text-yellow-500 mb-3"></i>
                <h3 className="font-semibold text-white mb-2">Charting Library Not Found</h3>
                <p className="text-zinc-400 text-xs max-w-xs">
                    The app is functional, but the chart can't be displayed.
                    Download the TradingView Charting Library and place it in the <code className="bg-zinc-700 text-cyan-300 px-1 rounded-sm">public/charting_library</code> folder.
                </p>
            </div>
        );
    }

    return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default memo(TradingViewChart);