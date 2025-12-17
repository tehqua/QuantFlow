// Data Models
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface OHLCV {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  qty: number;
  timestamp: number;
  pnl?: number;
  reason?: string; // e.g. "Signal: RSI < 30"
}

export interface Strategy {
  id: string;
  name: string;
  code: string;
  lastEdited: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  symbol: string;
  timeframe: string;
  trades: Trade[];
  equityCurve: { time: number; value: number }[];
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
  };
  status: 'running' | 'completed' | 'failed';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

export interface Position {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

export interface LiveStatus {
  isRunning: boolean;
  mode: 'paper' | 'live';
  activeOrders: number;
  currentEquity: number;
  lastUpdate: number;
  symbol: string;
  timeframe: string;
}