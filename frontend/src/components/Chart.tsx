"use client";
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

export default function Chart({ data, trades = [] }: { data: any[], trades?: any[] }) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const seriesRef = useRef<any>(null);

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
            height: 500,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
            },
        });

        // V5 Syntax: Use addSeries with the Series Class
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        seriesRef.current = candlestickSeries;
        chartRef.current = chart;

        // Load initial data
        if (data && data.length > 0) {
            const formattedData = data.map(d => ({
                time: new Date(d.time).getTime() / 1000,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            })).sort((a: any, b: any) => a.time - b.time);
            
            candlestickSeries.setData(formattedData);
        }

        // Resize handler
        const handleResize = () => {
            if(chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    // Update Trades Markers
    useEffect(() => {
        if(seriesRef.current && trades.length > 0) {
            const markers = trades.map(t => ({
                time: new Date(t.timestamp).getTime() / 1000,
                position: t.side === 'BUY' ? 'belowBar' : 'aboveBar',
                color: t.side === 'BUY' ? '#34d399' : '#f87171',
                shape: t.side === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: t.side,
                size: 1
            })).sort((a: any, b: any) => a.time - b.time);
            
            seriesRef.current.setMarkers(markers);
        }
    }, [trades]);

    return <div ref={chartContainerRef} className="w-full h-full min-h-[500px]" />;
}