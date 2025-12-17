import { OHLCV, BacktestResult, OrderSide, Trade } from '../types';

// Helper to get seconds per timeframe
const getTimeframeSeconds = (tf: string): number => {
    const map: Record<string, number> = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '4h': 14400,
        '1d': 86400,
        '1w': 604800
    };
    return map[tf] || 3600;
};

// Generate synthetic OHLCV data with "deep" history
export const generateOHLCV = (count: number, startPrice = 50000, timeframe = '1h'): OHLCV[] => {
  const data: OHLCV[] = [];
  let currentPrice = startPrice;
  const now = Math.floor(Date.now() / 1000);
  const interval = getTimeframeSeconds(timeframe);

  // Generate data going backwards
  for (let i = count; i > 0; i--) {
    const time = now - i * interval;
    const volatility = currentPrice * 0.005; // 0.5% volatility per candle
    const change = (Math.random() - 0.5) * (volatility * 2);
    
    let open = currentPrice;
    let close = currentPrice + change;
    let high = Math.max(open, close) + Math.random() * volatility;
    let low = Math.min(open, close) - Math.random() * volatility;
    let volume = Math.random() * 100 + 50;

    // Add some trend bias
    if (i % 100 < 50) currentPrice += volatility * 0.1; // Uptrend section
    else currentPrice -= volatility * 0.1; // Downtrend section

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    currentPrice = close;
  }
  
  // Explicitly sort just to be safe for charting library
  return data.sort((a, b) => a.time - b.time);
};

export const MOCK_STRATEGY_TEMPLATE = `# QuantFlow Strategy Template
# API Reference:
# self.data.Close[-1]  -> Current Candle Close
# self.data.Open[-1]   -> Current Candle Open
# self.buy(size, sl, tp) -> Place Buy Order
# self.sell(size, sl, tp) -> Place Sell Order

import talib

class MyStrategy(Strategy):
    """
    Simple Moving Average Crossover Strategy
    """
    
    # Define parameters (optimizable)
    n1 = 10
    n2 = 30

    def init(self):
        # Precompute indicators
        # self.I is a wrapper to plot on chart automatically
        self.sma_fast = self.I(talib.SMA, self.data.Close, self.n1)
        self.sma_slow = self.I(talib.SMA, self.data.Close, self.n2)

    def next(self):
        # Logic run on every new candle
        
        # Check if we have enough data
        if len(self.data) < self.n2:
            return

        # Crossover Logic
        if crossover(self.sma_fast, self.sma_slow):
            # Bullish Signal
            self.buy(size=0.1, sl=self.data.Close[-1]*0.95)
            
        elif crossover(self.sma_slow, self.sma_fast):
            # Bearish Signal
            self.sell(size=0.1, sl=self.data.Close[-1]*1.05)
            
        # Access account equity
        # print(f"Current Equity: {self.equity}")
`;

export const generateMockBacktest = (strategyId: string, currentData: OHLCV[]): BacktestResult => {
    // We simulate trades based on the PROVIDED chart data to ensure they line up perfectly
    const trades: Trade[] = [];
    const equityCurve = [];
    let balance = 10000;
    
    // Create random trades that align with visible candles
    // We skip the first 20 candles
    for(let i=20; i<currentData.length; i+=Math.floor(Math.random() * 15) + 5) {
        const candle = currentData[i];
        const isWin = Math.random() > 0.45;
        const side = Math.random() > 0.5 ? OrderSide.BUY : OrderSide.SELL;
        
        const pnlPercent = isWin ? (Math.random() * 0.05) : -(Math.random() * 0.02);
        const pnl = balance * pnlPercent;
        
        balance += pnl;

        trades.push({
            id: `tr_${i}`,
            symbol: 'BTCUSDT',
            side,
            price: candle.close,
            qty: 0.1,
            timestamp: candle.time,
            pnl,
            reason: side === OrderSide.BUY ? 'MA Crossover' : 'RSI Overbought'
        });
        
        equityCurve.push({ time: candle.time, value: balance });
    }

    // Calculate metrics
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const winRate = (winningTrades.length / trades.length) * 100;

    return {
        id: `bt_${Date.now()}`,
        strategyId,
        symbol: 'BTCUSDT',
        timeframe: '1h',
        trades,
        equityCurve,
        metrics: {
            totalReturn: ((balance - 10000) / 10000) * 100,
            sharpeRatio: 1.85,
            maxDrawdown: -4.2,
            winRate: winRate,
            profitFactor: 1.5,
            totalTrades: trades.length
        },
        status: 'completed'
    };
};