import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Calendar, ArrowUpRight, Info } from 'lucide-react';
import { SimulationResult, ScenarioResult } from '../services/simulationService';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

interface WhatIfBoxProps {
  result: SimulationResult;
  currency?: string;
  interval: string;
  theme?: 'light' | 'dark';
}

const ScenarioCard = ({ 
  title, 
  description, 
  result, 
  currency,
  isDark
}: { 
  title: string; 
  description: string; 
  result: ScenarioResult; 
  currency?: string;
  isDark: boolean;
}) => {
  if (!result.found) return null;
  const isProfit = result.profitPercent >= 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <h4 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>{title}</h4>
        <p className="text-[10px] text-zinc-400 leading-relaxed italic">{description}</p>
      </div>

      <div className={cn(
        "p-4 rounded-xl border",
        isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-100"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Entry Date</span>
          </div>
          <span className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {format(new Date(result.entryDate), 'dd MMM yyyy')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Entry Price</span>
          <span className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {formatCurrency(result.entryPrice, currency)}
          </span>
        </div>
      </div>

      <div className={cn(
        "p-4 rounded-xl border flex flex-col items-center justify-center text-center",
        isProfit 
          ? (isDark ? "bg-emerald-900/20 border-emerald-900/30" : "bg-emerald-50 border-emerald-100") 
          : (isDark ? "bg-rose-900/20 border-rose-900/30" : "bg-rose-50 border-rose-100")
      )}>
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-widest mb-1",
          isProfit ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-rose-400" : "text-rose-600")
        )}>
          Current Result
        </p>
        <div className="flex items-center gap-2 mb-1">
          {isProfit ? <TrendingUp className={cn("w-5 h-5", isDark ? "text-emerald-400" : "text-emerald-600")} /> : <TrendingDown className={cn("w-5 h-5", isDark ? "text-rose-400" : "text-rose-600")} />}
          <span className={cn(
            "text-4xl font-black tracking-tighter",
            isProfit ? (isDark ? "text-emerald-400" : "text-emerald-700") : (isDark ? "text-rose-400" : "text-rose-700")
          )}>
            {isProfit ? '+' : ''}{result.profitPercent.toFixed(2)}%
          </span>
        </div>
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-widest",
          isProfit ? (isDark ? "text-emerald-500" : "text-emerald-500") : (isDark ? "text-rose-500" : "text-rose-500")
        )}>
          {result.daysHeld} Days Held
        </p>
      </div>
    </div>
  );
};

export const WhatIfBox: React.FC<WhatIfBoxProps> = ({ result, currency, interval, theme }) => {
  const isDark = theme === 'dark';

  if (interval !== '1d' && interval !== '1wk') {
    return (
      <div className={cn(
        "rounded-2xl border p-6 transition-colors duration-300",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
      )}>
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <HelpCircle className="w-4 h-4" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">CrossVision Simulation</h3>
        </div>
        <p className="text-[10px] text-zinc-400 font-medium italic">
          Simulation is only available for Daily and Weekly timeframes.
        </p>
      </div>
    );
  }

  if (!result.found) {
    return (
      <div className={cn(
        "rounded-2xl border p-6 transition-colors duration-300",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
      )}>
        <div className={cn("flex items-center gap-2 mb-4", isDark ? "text-zinc-100" : "text-zinc-900")}>
          <HelpCircle className="w-4 h-4" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">CrossVision Simulation</h3>
        </div>
        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
          No recent Golden Cross (EMA 50 crossing above EMA 135) found in the current data range.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border p-6 shadow-sm overflow-hidden relative transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <HelpCircle className={cn("w-24 h-24", isDark ? "text-zinc-100" : "text-zinc-900")} />
      </div>

      <div className={cn("flex items-center gap-2 mb-6 relative z-10", isDark ? "text-zinc-100" : "text-zinc-900")}>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-zinc-100" : "bg-zinc-900")}>
          <ArrowUpRight className={cn("w-5 h-5", isDark ? "text-zinc-900" : "text-white")} />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight">CrossVision Simulation</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Comparison Strategies</p>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <ScenarioCard 
          title="Strategy A: EMA 50/135 Entry"
          description="ซื้อเมื่อเกิด Golden Cross และราคาเปิด/ปิดอยู่เหนือเส้น EMA ทั้งสองเส้นเป็นครั้งแรก"
          result={result.scenario1}
          currency={currency}
          isDark={isDark}
        />

        <div className={cn("h-px", isDark ? "bg-zinc-800" : "bg-zinc-100")} />

        <ScenarioCard 
          title="Strategy B: EMA 135/VWAP Entry"
          description="หลังเกิด Golden Cross จะซื้อเมื่อเส้น EMA 135 ตัดขึ้นเหนือเส้น VWAP ล่าสุด"
          result={result.scenario2}
          currency={currency}
          isDark={isDark}
        />

        <div className={cn("rounded-xl p-4", isDark ? "bg-zinc-800" : "bg-zinc-900")}>
          <div className="flex items-center gap-2 mb-2 text-zinc-400">
            <Info className="w-3 h-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Simulation Methodology</p>
          </div>
          <div className="space-y-3 text-[10px] leading-relaxed">
            <p className="text-zinc-300">
              <span className="font-bold text-rose-500">Golden Cross:</span> ระบบหาจุดตัด EMA 50 &gt; 135 ล่าสุด และเปรียบเทียบการเข้าซื้อ 2 รูปแบบ: (A) ราคายืนเหนือเส้น และ (B) EMA 135 ตัดเหนือ VWAP
            </p>
            <p className="text-zinc-300 border-t border-white/10 pt-2">
              <span className="font-bold text-rose-500">Death Cross Simulation:</span> คำนวณความผันผวนแบบถ่วงน้ำหนัก (70% 30 วันล่าสุด / 30% 90 วันย้อนหลัง) และใช้ Box-Muller transform จำลองราคา 20 วันล่วงหน้าเพื่อหาจุดตัด EMA 50 &lt; 135
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
