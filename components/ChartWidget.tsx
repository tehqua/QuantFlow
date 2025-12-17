import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  CandlestickSeries, 
  Time,
  CrosshairMode
} from 'lightweight-charts';
import { OHLCV, Trade, OrderSide, Timeframe } from '../types';
import { ChevronDown, RefreshCw } from 'lucide-react';

interface ChartWidgetProps {
  data: OHLCV[];
  trades?: Trade[];
  height?: number; // Optional: If provided, forces height. If not, fits parent.
  symbol?: string;
  timeframe?: string;
  onSymbolChange?: (sym: string) => void;
  onTimeframeChange?: (tf: Timeframe) => void;
}

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

const ChartWidget: React.FC<ChartWidgetProps> = ({ 
  data, 
  trades = [], 
  height, // Optional
  symbol = 'BTC/USDT',
  timeframe = '1h',
  onSymbolChange,
  onTimeframeChange
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height || chartContainerRef.current.clientHeight, // Use parent height if prop not set
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald 500
      downColor: '#ef4444', // Red 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    seriesRef.current = candlestickSeries;
    chartRef.current = chart;
    setIsChartReady(true);

    // Resize Observer to handle dynamic parent resizing
    const resizeObserver = new ResizeObserver(entries => {
        if (!chartRef.current || entries.length === 0) return;
        const { width, height: entryHeight } = entries[0].contentRect;
        // If prop height is fixed, use it, otherwise use container height
        chartRef.current.applyOptions({ 
            width, 
            height: height || entryHeight 
        });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); 

  // 2. Handle Explicit Height Prop Updates
  useEffect(() => {
    if (chartRef.current && height) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  // 3. Handle Data Updates
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      seriesRef.current.setData(sortedData);
    }
  }, [data]);

  // 4. Handle Trades (Markers)
  useEffect(() => {
    if (seriesRef.current && trades && trades.length > 0) {
      const markers = trades.map(t => ({
        time: t.timestamp as Time,
        position: t.side === OrderSide.BUY ? 'belowBar' : 'aboveBar',
        color: t.side === OrderSide.BUY ? '#34d399' : '#f87171',
        shape: t.side === OrderSide.BUY ? 'arrowUp' : 'arrowDown',
        text: `${t.side} ${t.pnl ? (t.pnl > 0 ? '+$'+t.pnl.toFixed(1) : '-$'+Math.abs(t.pnl).toFixed(1)) : ''}`,
        size: 1 // Size multiplier
      })).sort((a: any, b: any) => a.time - b.time);

      if (typeof seriesRef.current.setMarkers === 'function') {
        seriesRef.current.setMarkers(markers);
      }
    } else if (seriesRef.current && typeof seriesRef.current.setMarkers === 'function') {
        seriesRef.current.setMarkers([]);
    }
  }, [trades]);

  return (
    <div className="w-full h-full relative group">
      {/* Glassmorphism Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex gap-3">
        {/* Symbol Selector */}
        <div className="relative group/menu">
            <button className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition-all shadow-lg">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                {symbol}
                <ChevronDown size={14} className="text-slate-400" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden hidden group-hover/menu:block">
                {SYMBOLS.map(s => (
                    <button 
                        key={s}
                        onClick={() => onSymbolChange?.(s)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${s === symbol ? 'text-blue-400' : 'text-slate-300'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-lg">
            {TIMEFRAMES.map(tf => (
                <button
                    key={tf}
                    onClick={() => onTimeframeChange?.(tf)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        timeframe === tf 
                        ? 'bg-blue-600/80 text-white shadow-inner' 
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {tf}
                </button>
            ))}
        </div>
      </div>

      {/* Chart Container - Size controlled by parent via CSS */}
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {!isChartReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <RefreshCw className="animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default ChartWidget;