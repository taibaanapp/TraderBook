import { StockData } from '../types';
import { calculateEMA, calculateATR } from './indicators';

export interface Trade {
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  type: 'LONG';
  shares: number;
  pnl: number | null;
  pnlPercent: number | null;
  status: 'OPEN' | 'CLOSED';
  entryReason: string;
  exitReason: string | null;
  riskAmount: number;
  stopDistance: number;
}

export interface SimResult {
  trades: Trade[];
  equityCurve: { date: string; equity: number }[];
  kpis: {
    netProfit: number;
    netProfitPercent: number;
    profitFactor: number;
    maxDrawdown: number;
    ulcerIndex: number;
    winRate: number;
    riskRewardRatio: number;
    expectancy: number;
    recoveryFactor: number;
  };
}

export interface SimParams {
  initialCapital: number;
  fastEmaPeriod: number;
  slowEmaPeriod: number;
  atrPeriod: number;
  atrMultiplierSL: number;
  riskPerTradePercent: number;
}

export function runSimulation(candles: StockData[], params: SimParams): SimResult {
  const { initialCapital, fastEmaPeriod, slowEmaPeriod, atrPeriod, atrMultiplierSL, riskPerTradePercent } = params;
  
  const closes = candles.map(c => c.close);
  const fastEma = calculateEMA(closes, fastEmaPeriod);
  const slowEma = calculateEMA(closes, slowEmaPeriod);
  const atr = calculateATR(candles, atrPeriod);

  let equity = initialCapital;
  let currentTrade: Trade | null = null;
  const trades: Trade[] = [];
  const equityCurve: { date: string; equity: number }[] = [];
  
  let peakEquity = initialCapital;
  let maxDrawdown = 0;
  let drawdownSumSq = 0;

  for (let i = Math.max(fastEmaPeriod, slowEmaPeriod, atrPeriod); i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];
    
    // Update Equity Curve
    let currentEquity = equity;
    if (currentTrade) {
      currentEquity = equity + (candle.close - currentTrade.entryPrice) * currentTrade.shares;
    }
    equityCurve.push({ date: candle.date, equity: currentEquity });

    // Calculate Drawdown
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const drawdown = (peakEquity - currentEquity) / peakEquity * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    drawdownSumSq += drawdown * drawdown;

    // Logic
    const isUptrend = fastEma[i] > slowEma[i];
    const isBreakout = candle.close > prevCandle.high; // Simple trigger

    if (currentTrade) {
      // Check Exit
      const stopLossPrice = currentTrade.entryPrice - (atr[i] * atrMultiplierSL);
      const hitStopLoss = candle.low <= stopLossPrice;
      const trendReversal = fastEma[i] < slowEma[i];

      if (hitStopLoss || trendReversal) {
        const exitPrice = hitStopLoss ? stopLossPrice : candle.close;
        currentTrade.exitDate = candle.date;
        currentTrade.exitPrice = exitPrice;
        currentTrade.status = 'CLOSED';
        currentTrade.exitReason = hitStopLoss ? 'Stop Loss Hit (ATR)' : 'Trend Reversal (EMA Cross)';
        currentTrade.pnl = (exitPrice - currentTrade.entryPrice) * currentTrade.shares;
        currentTrade.pnlPercent = (currentTrade.pnl / (currentTrade.entryPrice * currentTrade.shares)) * 100;
        
        equity += currentTrade.pnl;
        trades.push(currentTrade);
        currentTrade = null;
      }
    } else {
      // Check Entry
      if (isUptrend && isBreakout) {
        const currentRiskAmount = equity * (riskPerTradePercent / 100);
        const currentStopDistance = atr[i] * atrMultiplierSL;
        
        if (currentStopDistance > 0) {
          const shares = Math.floor(currentRiskAmount / currentStopDistance);
          if (shares > 0 && shares * candle.close <= equity) {
            currentTrade = {
              entryDate: candle.date,
              entryPrice: candle.close,
              exitDate: null,
              exitPrice: null,
              type: 'LONG',
              shares,
              pnl: null,
              pnlPercent: null,
              status: 'OPEN',
              entryReason: 'Trend (EMA) + Breakout (High)',
              exitReason: null,
              riskAmount: currentRiskAmount,
              stopDistance: currentStopDistance
            };
          }
        }
      }
    }
  }

  // Close open trade at end
  if (currentTrade) {
    const lastCandle = candles[candles.length - 1];
    currentTrade.exitDate = lastCandle.date;
    currentTrade.exitPrice = lastCandle.close;
    currentTrade.status = 'CLOSED';
    currentTrade.exitReason = 'Simulation Ended';
    currentTrade.pnl = (lastCandle.close - currentTrade.entryPrice) * currentTrade.shares;
    currentTrade.pnlPercent = (currentTrade.pnl / (currentTrade.entryPrice * currentTrade.shares)) * 100;
    equity += currentTrade.pnl;
    trades.push(currentTrade);
  }

  // Calculate KPIs
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const winningTrades = closedTrades.filter(t => t.pnl! > 0);
  const losingTrades = closedTrades.filter(t => t.pnl! <= 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl!, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0));
  
  const netProfit = equity - initialCapital;
  const netProfitPercent = (netProfit / initialCapital) * 100;
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLoss;
  
  const ulcerIndex = Math.sqrt(drawdownSumSq / (equityCurve.length || 1));
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const riskRewardRatio = avgLoss === 0 ? (avgWin > 0 ? 999 : 0) : avgWin / avgLoss;
  
  const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);
  const recoveryFactor = maxDrawdown === 0 ? 999 : netProfitPercent / maxDrawdown;

  return {
    trades,
    equityCurve,
    kpis: {
      netProfit,
      netProfitPercent,
      profitFactor,
      maxDrawdown,
      ulcerIndex,
      winRate,
      riskRewardRatio,
      expectancy,
      recoveryFactor
    }
  };
}
