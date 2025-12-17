"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, Square, Activity, Save, Terminal } from 'lucide-react';

const Chart = dynamic(() => import('../components/Chart'), { ssr: false });
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const SAMPLE_STRATEGY = `# Example Breakout Strategy
# ctx variables: ctx.price, ctx.open, ctx.buy(qty), ctx.sell(qty)

# Simple Logic: Buy if price > open (green candle), Sell if price < open (red candle)

if ctx.price > ctx.open * 1.001:
    ctx.buy(0.1)
    ctx.log("Bought at breakout")
elif ctx.price < ctx.open * 0.999:
    ctx.sell(0.1)
    ctx.log("Sold at breakdown")
`;

export default function Home() {
  const [code, setCode] = useState(SAMPLE_STRATEGY);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePrice, setActivePrice] = useState(0);
  const [trades, setTrades] = useState<any[]>([]);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

  // Connect to WebSocket
  useEffect(() => {
    let ws: WebSocket;
    const connect = () => {
        ws = new WebSocket(WS_URL);
        
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "TICKER") {
                    setActivePrice(msg.data.c);
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onclose = () => {
             // Simple reconnect logic could go here
             console.log("WS Closed");
        };
    };

    connect();
    return () => {
        if(ws) ws.close();
    };
  }, [WS_URL]);

  const runBacktest = async () => {
    setIsRunning(true);
    setLogs(prev => ["Initializing backtest...", ...prev]);
    
    try {
        // 1. Save Strategy
        const saveRes = await fetch(`${API_URL}/api/strategies`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ name: "QuickRun", code: code })
        });
        const strategyData = await saveRes.json();

        // 2. Queue Backtest
        const runRes = await fetch(`${API_URL}/api/backtest/run`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                strategy_id: strategyData.id,
                symbol: "BTC/USDT",
                timeframe: "1h",
                start_date: "2023-01-01",
                end_date: "2023-01-07"
            })
        });
        const runData = await runRes.json();

        setLogs(prev => [`Job Queued: ${runData.run_id}`, ...prev]);

        // Poll for results (Mocking polling here)
        // In production, use websocket or proper polling interval
        setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/api/backtest/${runData.run_id}/results`);
                const json = await res.json();
                if(json.trades) {
                    setTrades(json.trades);
                    setLogs(prev => [`Backtest Complete. Trades: ${json.trades.length}`, ...prev]);
                } else {
                    setLogs(prev => [`Backtest finished but no trades returned.`, ...prev]);
                }
            } catch(e) {
                setLogs(prev => [`Error fetching results.`, ...prev]);
            }
            setIsRunning(false);
        }, 3000);

    } catch (e) {
        console.error(e);
        setLogs(prev => ["Error running backtest.", ...prev]);
        setIsRunning(false);
    }
  };

  const killSwitch = async () => {
      try {
          await fetch(`${API_URL}/api/kill-switch`, { method: "POST" });
          setLogs(prev => ["KILL SWITCH ACTIVATED", ...prev]);
      } catch (e) {
          setLogs(prev => ["Failed to activate Kill Switch", ...prev]);
      }
  };

  return (
    <main className="flex h-screen w-full p-4 gap-4">
      {/* LEFT: Editor & Controls */}
      <div className="flex flex-col w-1/3 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">QuantFlow</h1>
            <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/5 font-mono text-emerald-400">
                    BTC: ${activePrice ? activePrice.toFixed(2) : '...'}
                </span>
            </div>
        </div>
        
        <div className="glass-panel flex-1 rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-white/5 p-2 flex gap-2 border-b border-white/10">
                <button onClick={runBacktest} disabled={isRunning} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors disabled:opacity-50">
                    <Play size={14} /> {isRunning ? 'Running...' : 'Backtest'}
                </button>
                <button onClick={killSwitch} className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded text-sm font-medium transition-colors">
                    <Square size={14} /> STOP ALL
                </button>
            </div>
            <div className="flex-1 pt-2">
                <Editor 
                    height="100%" 
                    defaultLanguage="python" 
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{ minimap: { enabled: false }, fontSize: 13, backgroundColor: 'transparent' }} 
                />
            </div>
        </div>

        <div className="glass-panel h-1/3 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                <Terminal size={14} /> System Logs
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 text-slate-500">
                {logs.map((l, i) => <div key={i}>[{new Date().toLocaleTimeString()}] {l}</div>)}
            </div>
        </div>
      </div>

      {/* RIGHT: Chart & Results */}
      <div className="flex flex-col flex-1 gap-4">
          <div className="glass-panel flex-1 rounded-2xl p-4 relative">
             <Chart 
                data={[
                    {time: '2023-01-01 00:00', open: 100, high: 105, low: 98, close: 103},
                    {time: '2023-01-01 01:00', open: 103, high: 106, low: 102, close: 104},
                    {time: '2023-01-01 02:00', open: 104, high: 104, low: 99, close: 100},
                    {time: '2023-01-01 03:00', open: 100, high: 102, low: 98, close: 99},
                    {time: '2023-01-01 04:00', open: 99, high: 101, low: 97, close: 100},
                ]}
                trades={trades}
             />
          </div>
          
          <div className="h-1/4 flex gap-4">
              <div className="glass-panel flex-1 rounded-2xl p-4">
                  <h3 className="text-sm text-slate-400 mb-2">Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded">
                          <p className="text-xs text-slate-500">Total PnL</p>
                          <p className="text-xl font-bold text-emerald-400">+$1,240.50</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded">
                          <p className="text-xs text-slate-500">Win Rate</p>
                          <p className="text-xl font-bold text-blue-400">65%</p>
                      </div>
                  </div>
              </div>
              <div className="glass-panel flex-[2] rounded-2xl p-4 overflow-auto custom-scrollbar">
                   <h3 className="text-sm text-slate-400 mb-2">Trade List</h3>
                   <table className="w-full text-xs text-left text-slate-300">
                       <thead className="text-slate-500 border-b border-white/10">
                           <tr><th>Time</th><th>Side</th><th>Price</th><th>Qty</th></tr>
                       </thead>
                       <tbody>
                           {trades.map((t, i) => (
                               <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                   <td className="py-2">{new Date(t.timestamp).toLocaleString()}</td>
                                   <td className={t.side==='BUY'?'text-emerald-400':'text-red-400'}>{t.side}</td>
                                   <td>{t.price}</td>
                                   <td>{t.qty}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
              </div>
          </div>
      </div>
    </main>
  );
}