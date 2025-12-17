import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Code, 
  Play, 
  Terminal, 
  Settings, 
  LayoutDashboard, 
  Power,
  ShieldAlert,
  Save,
  Download,
  BookOpen,
  Info,
  Maximize2,
  Lock,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import ChartWidget from './components/ChartWidget';
import { generateOHLCV, MOCK_STRATEGY_TEMPLATE, generateMockBacktest } from './services/mockData';
import { BacktestResult, LiveStatus, OHLCV, Timeframe, LogEntry, Position } from './types';

// -- Simple Editor Mock --
const SimpleEditor: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <textarea
    className="w-full h-full bg-transparent text-slate-300 font-mono text-sm p-6 outline-none resize-none leading-relaxed"
    spellCheck={false}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'backtest' | 'live'>('dashboard');
  
  // State
  const [strategyCode, setStrategyCode] = useState(MOCK_STRATEGY_TEMPLATE);
  const [ohlcvData, setOhlcvData] = useState<OHLCV[]>([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');
  const [showApiDocs, setShowApiDocs] = useState(true);

  // Live Trading State
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({
    isRunning: false,
    mode: 'paper',
    activeOrders: 0,
    currentEquity: 10000,
    lastUpdate: Date.now(),
    symbol: 'BTC/USDT',
    timeframe: '15m'
  });
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [livePositions, setLivePositions] = useState<Position[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load initial data (Simulate "Deep History" by loading 5000 candles)
  useEffect(() => {
    const data = generateOHLCV(5000, 50000, selectedTimeframe);
    setOhlcvData(data);
  }, [selectedSymbol, selectedTimeframe]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  // Handlers
  const handleRunBacktest = () => {
    // Generate result based on CURRENT ohlcv data to ensure chart overlay matches
    const result = generateMockBacktest("strat_custom", ohlcvData);
    setBacktestResult(result);
    setActiveTab('backtest');
  };

  const handleStartLive = () => {
    if (liveStatus.mode === 'live' && (!apiKey || !apiSecret)) {
        alert("API Key and Secret are required for LIVE trading.");
        return;
    }
    setLiveStatus(prev => ({ ...prev, isRunning: true }));
    addLog("Initializing strategy engine...", "info");
    setTimeout(() => addLog("Connected to Binance WebSocket (BTC/USDT)", "success"), 500);
    setTimeout(() => addLog(`Starting ${liveStatus.mode.toUpperCase()} trading session...`, "info"), 1000);
  };

  const handleStopLive = () => {
    setLiveStatus(prev => ({ ...prev, isRunning: false }));
    addLog("Session stopped by user.", "warning");
  };

  const handleKillSwitch = () => {
      if(confirm("EMERGENCY STOP: This will cancel all open orders and stop the bot. Are you sure?")) {
        setLiveStatus(prev => ({ ...prev, isRunning: false, activeOrders: 0 }));
        setLivePositions([]);
        addLog("KILL SWITCH ACTIVATED. All orders cancelled.", "error");
      }
  };

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
      setLiveLogs(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          message,
          level
      }].slice(-100)); // Keep last 100 logs
  };

  // Simulation Loop for Live Mode
  useEffect(() => {
      if (!liveStatus.isRunning) return;

      const interval = setInterval(() => {
          // 1. Update timestamp
          setLiveStatus(prev => ({...prev, lastUpdate: Date.now()}));

          // 2. Simulate random price movement in PnL
          if (livePositions.length > 0) {
              setLivePositions(prev => prev.map(p => ({
                  ...p,
                  currentPrice: p.currentPrice + (Math.random() - 0.5) * 10,
                  pnl: (p.currentPrice - p.entryPrice) * p.qty * (p.side === 'BUY' ? 1 : -1)
              })));
          }

          // 3. Random Events
          const rand = Math.random();
          if (rand > 0.95) {
              addLog("Heartbeat: Strategy processing tick...", "info");
          } else if (rand > 0.98) {
              // Simulate Signal
              if (livePositions.length === 0) {
                  addLog("Signal Detected: BUY BTC/USDT @ Market", "success");
                  const price = 64000 + Math.random() * 500;
                  setLivePositions([{
                      symbol: 'BTC/USDT',
                      side: 'BUY',
                      qty: 0.5,
                      entryPrice: price,
                      currentPrice: price,
                      pnl: 0
                  }]);
              } else {
                   addLog("Signal Detected: Close Position", "warning");
                   setLivePositions([]);
                   setLiveStatus(prev => ({...prev, currentEquity: prev.currentEquity + (Math.random() * 50)}));
              }
          }

      }, 1000);

      return () => clearInterval(interval);
  }, [liveStatus.isRunning, livePositions]);

  // --- Components ---

  const SidebarItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative group flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-300 ${
        activeTab === id 
          ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500/30' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''} />
      <span className="font-medium tracking-wide">{label}</span>
      {activeTab === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]" />}
    </button>
  );

  const ApiDocItem = ({ name, type, desc }: any) => (
      <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">{name}</span>
              <span className="text-xs text-slate-500 italic">{type}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
  );

  // --- Views ---

  const DashboardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Chart Section */}
      <div className="lg:col-span-9 flex flex-col gap-6 h-full">
          <div className="flex-1 p-1 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
            <ChartWidget 
                data={ohlcvData} 
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                onSymbolChange={setSelectedSymbol}
                onTimeframeChange={setSelectedTimeframe}
                // No fixed height, let it fill container
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4 h-32 flex-shrink-0">
               {[
                   { l: 'Total PnL', v: '+$2,450.32', c: 'text-emerald-400', g: 'from-emerald-500/20' },
                   { l: 'Open Positions', v: '3', c: 'text-blue-400', g: 'from-blue-500/20' },
                   { l: 'Win Rate', v: '68%', c: 'text-purple-400', g: 'from-purple-500/20' },
                   { l: 'Margin Usage', v: '12%', c: 'text-yellow-400', g: 'from-yellow-500/20' },
               ].map((s, i) => (
                   <div key={i} className={`p-4 rounded-xl bg-slate-900/60 backdrop-blur border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-all`}>
                       <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${s.g} to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                       <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{s.l}</p>
                       <p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</p>
                   </div>
               ))}
          </div>
      </div>

      {/* Side Feed */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2 flex-shrink-0">
                  <Activity size={16} className="text-blue-500" /> Market Ticks
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {[...Array(20)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 rounded hover:bg-white/5 transition-colors border-b border-white/5">
                          <span className="text-slate-400 font-mono">10:42:{10+i}</span>
                          <span className={i % 3 === 0 ? 'text-red-400' : 'text-emerald-400'}>
                              {i % 3 === 0 ? 'SELL' : 'BUY'}
                          </span>
                          <span className="font-mono text-slate-200">{(64200 + Math.random()*50).toFixed(1)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );

  const EditorView = () => (
    <div className="h-full flex gap-6">
      <div className="flex-1 flex flex-col gap-4 h-full">
        {/* Editor Toolbar */}
        <div className="flex-shrink-0 flex justify-between items-center bg-slate-900/80 backdrop-blur border border-white/10 p-3 rounded-xl">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                    <Code size={16} className="text-yellow-500" />
                    <span className="text-sm font-medium text-slate-200">MA_Crossover_Strategy.py</span>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setShowApiDocs(!showApiDocs)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${showApiDocs ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-transparent border-transparent text-slate-400 hover:text-white'}`}
                >
                    <BookOpen size={16} /> API Docs
                </button>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-sm font-medium transition-all">
                    <Save size={16} /> Save
                </button>
                <button 
                    onClick={handleRunBacktest}
                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 transition-all text-white"
                >
                    <Play size={16} fill="currentColor" /> Run Backtest
                </button>
            </div>
        </div>
        
        {/* Editor Area */}
        <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl relative min-h-0">
            <SimpleEditor value={strategyCode} onChange={setStrategyCode} />
            <div className="absolute bottom-4 right-4 text-xs text-slate-500 font-mono">Python 3.10 Environment</div>
        </div>
      </div>

      {/* API Reference Sidebar */}
      {showApiDocs && (
          <div className="w-80 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 h-full">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-400" /> API Reference
                  </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <p className="text-xs text-slate-500 mb-4">Available objects and methods within the <code>next(self)</code> loop.</p>
                  
                  <div className="space-y-6">
                      <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Market Data</h4>
                          <ApiDocItem name="self.data.Close" type="np.array" desc="Array of closing prices. Use [-1] for current." />
                          <ApiDocItem name="self.data.Open" type="np.array" desc="Array of opening prices." />
                          <ApiDocItem name="self.data.Volume" type="np.array" desc="Array of volume data." />
                      </div>

                      <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Trading</h4>
                          <ApiDocItem name="self.buy()" type="method" desc="Place a market buy order. Args: size (float), sl (float), tp (float)." />
                          <ApiDocItem name="self.sell()" type="method" desc="Place a market sell order. Args: size (float), sl (float), tp (float)." />
                          <ApiDocItem name="self.position" type="object" desc="Current open position. Returns None if flat." />
                      </div>

                      <div>
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Indicators (TA-Lib)</h4>
                          <ApiDocItem name="self.I(func, data, period)" type="method" desc="Wrapper to calculate and plot indicators automatically." />
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );

  const BacktestView = () => (
    <div className="h-full flex flex-col gap-6">
       {!backtestResult ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-sm">
               <div className="p-6 bg-slate-800/50 rounded-full mb-4 animate-pulse">
                   <Terminal size={48} className="opacity-50 text-blue-400" />
               </div>
               <h3 className="text-xl font-medium text-slate-300">Ready to Backtest</h3>
               <p className="text-sm mt-2">Write your logic in the Strategy Editor and hit Run.</p>
           </div>
       ) : (
           <>
            {/* Top Metrics Bar */}
            <div className="grid grid-cols-6 gap-4 flex-shrink-0">
                {[
                    { l: 'Total Return', v: `${backtestResult.metrics.totalReturn.toFixed(2)}%`, c: backtestResult.metrics.totalReturn > 0 ? 'text-emerald-400' : 'text-red-400' },
                    { l: 'Win Rate', v: `${backtestResult.metrics.winRate.toFixed(1)}%`, c: 'text-blue-400' },
                    { l: 'Profit Factor', v: backtestResult.metrics.profitFactor.toFixed(2), c: 'text-yellow-400' },
                    { l: 'Sharpe Ratio', v: backtestResult.metrics.sharpeRatio, c: 'text-purple-400' },
                    { l: 'Max Drawdown', v: `${backtestResult.metrics.maxDrawdown}%`, c: 'text-red-400' },
                    { l: 'Total Trades', v: backtestResult.metrics.totalTrades, c: 'text-slate-200' },
                ].map((m, i) => (
                    <div key={i} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{m.l}</p>
                        <p className={`text-xl font-bold font-mono ${m.c}`}>{m.v}</p>
                    </div>
                ))}
            </div>

            {/* Main Visualizer */}
            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-[3] flex flex-col bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 flex-shrink-0">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                             Visual Analysis <span className="text-xs font-normal text-slate-500 ml-2">(Trades overlaid)</span>
                        </h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs text-emerald-400"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Buy</span>
                            <span className="flex items-center gap-1 text-xs text-red-400"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Sell</span>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <ChartWidget 
                            data={ohlcvData} 
                            trades={backtestResult.trades} 
                            // height={450}  <-- Remove fixed height, let it fill
                            symbol={backtestResult.symbol}
                            timeframe={backtestResult.timeframe}
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center flex-shrink-0">
                        <h3 className="text-sm font-bold text-slate-300">Trade Log</h3>
                        <button className="text-xs p-1 hover:bg-white/10 rounded transition-colors text-blue-400"><Download size={14}/></button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-slate-500 uppercase bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-4 py-2 font-semibold">Time</th>
                                    <th className="px-2 py-2 font-semibold">Type</th>
                                    <th className="px-2 py-2 font-semibold text-right">Price</th>
                                    <th className="px-4 py-2 font-semibold text-right">PnL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {backtestResult.trades.map(t => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors cursor-default group">
                                        <td className="px-4 py-2 text-slate-400 font-mono whitespace-nowrap">
                                            {new Date(t.timestamp * 1000).toLocaleDateString()}
                                            <span className="text-slate-600 ml-1">{new Date(t.timestamp * 1000).toLocaleTimeString()}</span>
                                        </td>
                                        <td className={`px-2 py-2 font-bold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side}</td>
                                        <td className="px-2 py-2 text-right font-mono text-slate-300">{t.price.toFixed(2)}</td>
                                        <td className={`px-4 py-2 text-right font-mono font-bold ${t.pnl && t.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.pnl ? (t.pnl > 0 ? '+' : '') + t.pnl.toFixed(2) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
           </>
       )}
    </div>
  );

  const LiveView = () => (
      <div className="h-full flex gap-6">
          {/* Left: Config & Control Panel */}
          <div className="w-80 flex flex-col gap-4 h-full">
              <div className="p-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl flex-shrink-0">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4">
                      <Settings size={16} className="text-blue-500" /> Configuration
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-xs text-slate-500 uppercase font-bold">Trading Mode</label>
                          <div className="flex p-1 bg-white/5 rounded-lg">
                              <button 
                                  onClick={() => setLiveStatus(p => ({...p, mode: 'paper'}))}
                                  disabled={liveStatus.isRunning}
                                  className={`flex-1 text-xs font-medium py-1.5 rounded transition-all ${liveStatus.mode === 'paper' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >
                                  PAPER
                              </button>
                              <button 
                                  onClick={() => setLiveStatus(p => ({...p, mode: 'live'}))}
                                  disabled={liveStatus.isRunning}
                                  className={`flex-1 text-xs font-medium py-1.5 rounded transition-all ${liveStatus.mode === 'live' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >
                                  LIVE
                              </button>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs text-slate-500 uppercase font-bold">API Key</label>
                          <div className="relative group">
                              <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400" />
                              <input 
                                  type="password" 
                                  value={apiKey}
                                  onChange={(e) => setApiKey(e.target.value)}
                                  disabled={liveStatus.isRunning || liveStatus.mode === 'paper'}
                                  placeholder={liveStatus.mode === 'paper' ? "Not required for paper" : "Binance API Key"}
                                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                              />
                          </div>
                          <div className="relative group">
                              <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400" />
                              <input 
                                  type="password" 
                                  value={apiSecret}
                                  onChange={(e) => setApiSecret(e.target.value)}
                                  disabled={liveStatus.isRunning || liveStatus.mode === 'paper'}
                                  placeholder={liveStatus.mode === 'paper' ? "Not required for paper" : "Binance Secret"}
                                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                              />
                          </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                          {!liveStatus.isRunning ? (
                              <button 
                                  onClick={handleStartLive}
                                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                  <Power size={16} /> START ENGINE
                              </button>
                          ) : (
                              <button 
                                  onClick={handleStopLive}
                                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                              >
                                  <Power size={16} /> STOP SESSION
                              </button>
                          )}
                      </div>
                  </div>
              </div>
              
              {/* Kill Switch - Always Visible */}
              <button 
                  onClick={handleKillSwitch}
                  className="flex-shrink-0 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 group transition-all"
              >
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-400 group-hover:scale-110 transition-transform">
                      <ShieldAlert size={24} />
                  </div>
                  <div className="text-left">
                      <p className="text-red-400 font-bold text-sm">EMERGENCY KILL</p>
                      <p className="text-red-400/60 text-[10px]">Stop all execution & Cancel orders</p>
                  </div>
              </button>

              {/* Status Card */}
              <div className="p-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl flex-1 min-h-0 overflow-y-auto">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Live Statistics</h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">Status</span>
                          <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${liveStatus.isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                              {liveStatus.isRunning ? 'RUNNING' : 'IDLE'}
                          </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">Uptime</span>
                          <span className="text-slate-200 font-mono text-xs">00:12:45</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">Latency</span>
                          <span className="text-emerald-400 font-mono text-xs flex items-center gap-1"><Wifi size={10}/> 45ms</span>
                      </div>
                      <div className="h-px bg-white/5 my-2"></div>
                      <div>
                          <p className="text-slate-500 text-[10px] uppercase">Equity</p>
                          <p className="text-xl font-bold text-white font-mono">${liveStatus.currentEquity.toFixed(2)}</p>
                          <p className="text-xs text-emerald-400 flex items-center gap-1">+2.4% <span className="text-slate-600">today</span></p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right: Main Monitoring */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
              {/* Realtime Chart */}
              <div className="flex-[2] bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col min-h-0">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <span className="px-2 py-1 rounded bg-black/40 backdrop-blur text-xs font-mono text-emerald-400 border border-white/5 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Feed
                      </span>
                  </div>
                  <ChartWidget 
                      data={ohlcvData}
                      symbol={selectedSymbol}
                      timeframe={selectedTimeframe} 
                      // height={400} // Dynamic
                  />
              </div>

              {/* Bottom Panel: Logs & Positions */}
              <div className="flex-1 min-h-[200px] flex gap-6">
                  {/* Console Logs */}
                  <div className="flex-1 bg-[#0d1117] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-inner">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                              <Terminal size={12} /> Execution Logs
                          </span>
                          <button onClick={() => setLiveLogs([])} className="text-[10px] text-slate-500 hover:text-white">CLEAR</button>
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 custom-scrollbar bg-black/20">
                          {liveLogs.length === 0 && (
                              <div className="text-slate-600 italic text-center mt-10">Waiting for engine start...</div>
                          )}
                          {liveLogs.map((log) => (
                              <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                                  <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                  <span className={`${
                                      log.level === 'info' ? 'text-blue-300' :
                                      log.level === 'success' ? 'text-emerald-400' :
                                      log.level === 'warning' ? 'text-yellow-400' :
                                      'text-red-400'
                                  }`}>
                                      {log.level === 'error' && <AlertTriangle size={10} className="inline mr-1" />}
                                      {log.message}
                                  </span>
                              </div>
                          ))}
                          <div ref={logsEndRef} />
                      </div>
                  </div>

                  {/* Active Positions */}
                  <div className="w-96 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex-shrink-0">
                          <span className="text-xs font-bold text-slate-400">Open Positions ({livePositions.length})</span>
                      </div>
                      <div className="flex-1 overflow-auto p-2 custom-scrollbar">
                          {livePositions.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                                  <div className="p-3 bg-white/5 rounded-full mb-2"><Activity size={16} /></div>
                                  No open positions
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  {livePositions.map((pos, idx) => (
                                      <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                          <div className="flex justify-between mb-2">
                                              <span className="font-bold text-sm text-white">{pos.symbol}</span>
                                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${pos.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{pos.side}</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-400">
                                              <span>Size: <span className="text-slate-200 font-mono">{pos.qty}</span></span>
                                              <span className="text-right">Entry: <span className="text-slate-200 font-mono">{pos.entryPrice.toFixed(2)}</span></span>
                                              <span>Mark: <span className="text-slate-200 font-mono">{pos.currentPrice.toFixed(2)}</span></span>
                                              <span className="text-right font-bold font-mono text-emerald-400">{pos.pnl > 0 ? '+' : ''}{pos.pnl.toFixed(2)}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-dvh bg-[#050505] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-4 z-50">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="hidden lg:block text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            QuantFlow
          </h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="editor" icon={Code} label="Strategy" />
          <SidebarItem id="backtest" icon={Play} label="Backtest" />
          <SidebarItem id="live" icon={Activity} label="Live Trading" />
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
            <SidebarItem id="settings" icon={Settings} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
         {/* Background Ambient Effects */}
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

         <header className="h-20 flex items-center justify-between px-8 z-10 flex-shrink-0">
             <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab}</h2>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Workspace / {activeTab}</p>
             </div>
             
             <div className="flex items-center gap-6">
                 <div className="text-right">
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Balance</p>
                     <p className="font-mono text-xl font-bold text-emerald-400 drop-shadow-sm">$12,450.32</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center ring-2 ring-transparent hover:ring-blue-500/50 transition-all cursor-pointer">
                     <span className="font-bold text-xs text-blue-400">USR</span>
                 </div>
             </div>
         </header>

         {/* Updated Wrapper: overflow-hidden + p-6 + h-full views */}
         <div className="flex-1 overflow-hidden p-6 pb-6 relative z-10">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'editor' && <EditorView />}
            {activeTab === 'backtest' && <BacktestView />}
            {activeTab === 'live' && <LiveView />}
         </div>
      </main>
    </div>
  );
}