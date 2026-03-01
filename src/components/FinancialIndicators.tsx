import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, ShieldCheck, DollarSign, BarChart3, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface FinancialData {
  annual: any[];
  quarterly: any[];
  stats: {
    pe: number;
    forwardPE: number;
    pb: number;
    roe: number;
    roa: number;
    profitMargin: number;
    operatingMargin: number;
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    revenueGrowth: number;
    earningsGrowth: number;
    dividendYield: number;
    payoutRatio: number;
    targetPrice: number;
    recommendation: string;
  };
  valuation: {
    grahamNumber: number | null;
    peFairValue: number | null;
    targetPrice: number | null;
  };
}

interface FinancialIndicatorsProps {
  symbol: string;
  theme?: 'light' | 'dark';
}

export const FinancialIndicators: React.FC<FinancialIndicatorsProps> = ({ symbol, theme }) => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'annual' | 'quarterly'>('quarterly');

  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchFinancials = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/financials/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch financials');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, [symbol]);

  if (loading) {
    return (
      <div className={cn(
        "rounded-2xl border p-8 animate-pulse transition-colors duration-300",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className={cn("h-8 w-64 rounded mb-6", isDark ? "bg-zinc-800" : "bg-zinc-100")} />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={cn("h-12 rounded-xl", isDark ? "bg-zinc-800/50" : "bg-zinc-50")} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const currentData = view === 'annual' ? data.annual : data.quarterly;
  
  // Calculate Quality Score (0-100)
  const calculateQualityScore = () => {
    let score = 0;
    const s = data.stats;
    if (!s) return 0;
    
    // Profitability (40 points)
    if (s.roe > 0.15) score += 20;
    else if (s.roe > 0.10) score += 10;
    
    if (s.profitMargin > 0.10) score += 20;
    else if (s.profitMargin > 0.05) score += 10;
    
    // Solvency & Liquidity (30 points)
    if (s.currentRatio > 1.5) score += 15;
    else if (s.currentRatio > 1.0) score += 7;
    
    if (s.debtToEquity < 100) score += 15;
    else if (s.debtToEquity < 200) score += 7;
    
    // Growth (30 points)
    if (s.revenueGrowth > 0.10) score += 15;
    else if (s.revenueGrowth > 0) score += 7;
    
    if (s.earningsGrowth > 0.10) score += 15;
    else if (s.earningsGrowth > 0) score += 7;
    
    return score;
  };

  const qualityScore = calculateQualityScore();

  // Helper to calculate ratios for a specific period
  const calculateRatios = (period: any) => {
    const roe = period.netIncome && period.totalEquity ? (period.netIncome / period.totalEquity) * 100 : null;
    const netMargin = period.netIncome && period.revenue ? (period.netIncome / period.revenue) * 100 : null;
    const currentRatio = period.currentAssets && period.currentLiabilities ? period.currentAssets / period.currentLiabilities : null;
    const quickRatio = period.currentAssets && period.currentLiabilities ? (period.currentAssets - (period.inventory || 0)) / period.currentLiabilities : null;
    const debtToEquity = period.totalDebt && period.totalEquity ? (period.totalDebt / period.totalEquity) : null;
    const revenue = period.revenue ? period.revenue / 1000000 : null; // In Millions
    const netIncome = period.netIncome ? period.netIncome / 1000000 : null; // In Millions

    return {
      date: period.date ? new Date(period.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A',
      revenue,
      netIncome,
      roe,
      netMargin,
      currentRatio,
      quickRatio,
      debtToEquity
    };
  };

  const processedPeriods = currentData.map(calculateRatios).slice(0, 8); // Show up to 8 periods

  const TableRow = ({ label, keyName, unit = '', precision = 2, highlight = false }: any) => (
    <tr className={cn(
      "border-b transition-colors",
      isDark ? "border-zinc-800 hover:bg-zinc-800/30" : "border-zinc-100 hover:bg-zinc-50/50",
      highlight && (isDark ? "bg-zinc-800/20" : "bg-zinc-50/30")
    )}>
      <td className={cn(
        "py-4 px-4 text-[10px] font-bold uppercase tracking-wider sticky left-0 z-10 border-r min-w-[180px]",
        isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-white text-zinc-500 border-zinc-100"
      )}>
        {label}
      </td>
      {processedPeriods.map((p, i) => {
        const val = (p as any)[keyName];
        const prevVal = (processedPeriods[i + 1] as any)?.[keyName];
        const isBetter = val !== null && prevVal !== null ? (
          keyName === 'debtToEquity' ? val < prevVal : val > prevVal
        ) : null;

        return (
          <td key={i} className="py-4 px-6 text-right">
            <div className="flex flex-col items-end">
              <span className={cn("text-sm font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {val !== null ? val.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision }) : '-'}
                {val !== null ? unit : ''}
              </span>
              {isBetter !== null && (
                <span className={cn(
                  "text-[9px] font-bold uppercase mt-0.5 flex items-center gap-0.5",
                  isBetter ? "text-emerald-500" : "text-rose-500"
                )}>
                  {isBetter ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isBetter ? 'Improved' : 'Declined'}
                </span>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className={cn("p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4", isDark ? "border-zinc-800" : "border-zinc-100")}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-100" : "bg-zinc-900")}>
            <BarChart3 className={cn("w-5 h-5", isDark ? "text-zinc-900" : "text-white")} />
          </div>
          <div>
            <h3 className={cn("text-base font-black uppercase tracking-widest", isDark ? "text-zinc-100" : "text-zinc-900")}>CrossVision Financials</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Historical Fundamental Trends (Last 3 Years)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn("flex p-1 rounded-lg border", isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
            <button
              onClick={() => setView('annual')}
              className={cn(
                "px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                view === 'annual' 
                  ? (isDark ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}
            >
              Annual
            </button>
            <button
              onClick={() => setView('quarterly')}
              className={cn(
                "px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                view === 'quarterly' 
                  ? (isDark ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}
            >
              Quarterly
            </button>
          </div>
        </div>
      </div>

      {/* Quality Overview Cards */}
      <div className={cn("grid grid-cols-1 md:grid-cols-4 border-b", isDark ? "border-zinc-800" : "border-zinc-100")}>
        <div className={cn("p-6 border-r", isDark ? "border-zinc-800" : "border-zinc-100")}>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Quality Score</p>
          <div className="flex items-end gap-2">
            <span className={cn(
              "text-3xl font-black",
              qualityScore > 70 ? "text-emerald-500" : qualityScore > 40 ? "text-amber-500" : "text-rose-500"
            )}>{qualityScore}</span>
            <span className="text-[10px] font-bold text-zinc-400 mb-1">/ 100</span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">
            {qualityScore > 70 ? "High Quality" : qualityScore > 40 ? "Average Quality" : "Poor Quality"}
          </p>
        </div>

        <div className={cn("p-6 border-r", isDark ? "border-zinc-800" : "border-zinc-100")}>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Fair Value (Est.)</p>
          <div className="flex items-end gap-2">
            <span className={cn("text-2xl font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {data.valuation?.grahamNumber 
                ? data.valuation.grahamNumber.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                : data.valuation?.peFairValue 
                  ? data.valuation.peFairValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : 'N/A'}
            </span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">
            {data.valuation?.grahamNumber ? "Graham Number" : data.valuation?.peFairValue ? "PE-Based (15x)" : "Intrinsic Estimate"}
          </p>
        </div>

        <div className={cn("p-6 border-r", isDark ? "border-zinc-800" : "border-zinc-100")}>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Analyst Target</p>
          <div className="flex items-end gap-2">
            <span className={cn("text-2xl font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {data.valuation?.targetPrice ? data.valuation.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
            </span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">Mean Price Target</p>
        </div>

        <div className="p-6">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Recommendation</p>
          <div className="flex items-end gap-2">
            <span className={cn(
              "text-xl font-black uppercase",
              data.stats.recommendation?.toLowerCase().includes('buy') ? "text-emerald-500" : (isDark ? "text-zinc-100" : "text-zinc-900")
            )}>
              {data.stats.recommendation || 'N/A'}
            </span>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1">Market Consensus</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={cn("border-b", isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50/50 border-zinc-200")}>
              <th className={cn(
                "py-4 px-4 text-left text-[9px] font-black uppercase tracking-[0.2em] sticky left-0 z-10 border-r",
                isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-zinc-50/50 text-zinc-400 border-zinc-100"
              )}>
                Metric / Period
              </th>
              {processedPeriods.map((p, i) => (
                <th key={i} className={cn("py-4 px-6 text-right text-[9px] font-black uppercase tracking-[0.2em]", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  {p.date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className={isDark ? "bg-zinc-800/20" : "bg-zinc-100/30"}>
              <td colSpan={processedPeriods.length + 1} className="py-2 px-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                Profitability Ratios
              </td>
            </tr>
            <TableRow label="Revenue (M)" keyName="revenue" precision={0} />
            <TableRow label="Net Income (M)" keyName="netIncome" precision={0} />
            <TableRow label="ROE (%)" keyName="roe" unit="%" />
            <TableRow label="Net Margin (%)" keyName="netMargin" unit="%" />
            
            <tr className={isDark ? "bg-zinc-800/20" : "bg-zinc-100/30"}>
              <td colSpan={processedPeriods.length + 1} className="py-2 px-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                Liquidity Ratios
              </td>
            </tr>
            <TableRow label="Current Ratio" keyName="currentRatio" />
            <TableRow label="Quick Ratio" keyName="quickRatio" />
            
            <tr className={isDark ? "bg-zinc-800/20" : "bg-zinc-100/30"}>
              <td colSpan={processedPeriods.length + 1} className="py-2 px-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                Leverage Ratios
              </td>
            </tr>
            <TableRow label="Debt to Equity" keyName="debtToEquity" />
            
            <tr className={isDark ? "bg-zinc-800/20" : "bg-zinc-100/30"}>
              <td colSpan={processedPeriods.length + 1} className="py-2 px-4 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                Valuation & Dividends
              </td>
            </tr>
            <tr className={cn("border-b", isDark ? "border-zinc-800" : "border-zinc-100")}>
              <td className={cn(
                "py-4 px-4 text-[10px] font-bold uppercase tracking-wider sticky left-0 z-10 border-r",
                isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-white text-zinc-500 border-zinc-100"
              )}>
                P/E (Trailing / Forward)
              </td>
              <td colSpan={processedPeriods.length} className={cn("py-4 px-6 text-right text-sm font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {data.stats.pe?.toFixed(2) || 'N/A'} / {data.stats.forwardPE?.toFixed(2) || 'N/A'}
              </td>
            </tr>
            <tr className={cn("border-b", isDark ? "border-zinc-800" : "border-zinc-100")}>
              <td className={cn(
                "py-4 px-4 text-[10px] font-bold uppercase tracking-wider sticky left-0 z-10 border-r",
                isDark ? "bg-zinc-900 text-zinc-500 border-zinc-800" : "bg-white text-zinc-500 border-zinc-100"
              )}>
                Dividend Yield
              </td>
              <td colSpan={processedPeriods.length} className={cn("py-4 px-6 text-right text-sm font-black", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {data.stats.dividendYield ? (data.stats.dividendYield * 100).toFixed(2) + '%' : '0.00%'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={cn("p-6 border-t", isDark ? "bg-zinc-800/20 border-zinc-800" : "bg-zinc-50 border-zinc-100")}>
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-lg border", isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200")}>
            <Info className={cn("w-4 h-4", isDark ? "text-zinc-100" : "text-zinc-900")} />
          </div>
          <div className="flex-1">
            <h4 className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-zinc-100" : "text-zinc-900")}>Quality Score Methodology</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              The Quality Score is a composite metric based on **Profitability** (ROE, Margins), **Financial Strength** (Liquidity, Debt), and **Growth** (Revenue, Earnings). 
              A score above 70 indicates a high-quality business. **Fair Value** is estimated using the Graham Number or a 15x PE multiple as a fallback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
