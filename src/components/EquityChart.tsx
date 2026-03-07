import React, { useMemo, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.equity_chart;

interface EquityChartProps {
  data: { date: string; equity: number }[];
  theme?: 'light' | 'dark';
}

export function EquityChart({ data, theme = 'light' }: EquityChartProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const processedData = useMemo(() => {
    if (!data || data.length === 0 || isCollapsed) return [];
    
    const baseline = data[0].equity;
    // Threshold for "significant" change: 4% of initial capital
    const threshold = baseline * 0.04;
    
    const result = [];
    let lastIncludedValue = baseline;
    
    // Add the starting point (zero PnL)
    result.push({
      date: data[0].date,
      pnl: 0,
      equity: baseline,
      isSignificant: true
    });

    for (let i = 1; i < data.length; i++) {
      const item = data[i];
      const changeFromLast = Math.abs(item.equity - lastIncludedValue);
      
      // Only include if the change is significant or it's the final point
      if (changeFromLast >= threshold || i === data.length - 1) {
        result.push({
          date: item.date,
          pnl: item.equity - baseline,
          equity: item.equity,
          isSignificant: true
        });
        lastIncludedValue = item.equity;
      }
    }

    // If we still have too many points (e.g. very volatile stock), cap it at 50 for "rough" view
    if (result.length > 50) {
      const step = Math.ceil(result.length / 50);
      return result.filter((_, i) => i % step === 0 || i === result.length - 1);
    }

    return result;
  }, [data, isCollapsed]);

  if (!data || data.length === 0) return null;

  return (
    <div className={cn(
      "w-full p-4 rounded-xl border shadow-sm flex flex-col transition-all duration-300",
      theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200",
      isCollapsed ? "h-16" : "h-80"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className={cn("w-4 h-4", theme === 'dark' ? "text-indigo-400" : "text-indigo-600")} />
          <div>
            <h3 className={cn("text-sm font-bold", theme === 'dark' ? "text-zinc-100" : "text-gray-900")}>
              {t.title}
            </h3>
            {!isCollapsed && (
              <p className={cn("text-[10px]", theme === 'dark' ? "text-zinc-500" : "text-gray-400")}>
                {t.description}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            theme === 'dark' ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-500"
          )}
        >
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>
      
      {!isCollapsed && processedData.length > 0 && (
        <div className="flex-1 min-h-0 animate-in fade-in duration-500">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={processedData} 
              margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#3f3f46" : "#E5E7EB"} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => {
                  const d = new Date(tick);
                  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                }}
                stroke={theme === 'dark' ? "#a1a1aa" : "#9CA3AF"}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                tickFormatter={(tick) => `${tick >= 0 ? '+' : ''}$${Math.abs(tick).toLocaleString()}`}
                stroke={theme === 'dark' ? "#a1a1aa" : "#9CA3AF"}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip 
                isAnimationActive={false}
                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                formatter={(value: number, name: string, props: any) => {
                  const equity = props.payload.equity;
                  return [
                    <span className="flex flex-col gap-1">
                      <span className={value >= 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                        {value >= 0 ? '+' : '-'}${Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      <span className={theme === 'dark' ? "text-zinc-400 text-[10px]" : "text-gray-500 text-[10px]"}>
                        {t.total}: ${equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </span>,
                    t.pnl
                  ];
                }}
                labelFormatter={(label) => `${t.date}: ${label}`}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: theme === 'dark' ? '1px solid #3f3f46' : '1px solid #E5E7EB', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                  padding: '12px'
                }}
              />
              <ReferenceLine y={0} stroke={theme === 'dark' ? "#52525b" : "#94a3b8"} strokeWidth={1} />
              <Bar 
                dataKey="pnl" 
                isAnimationActive={false}
                radius={[4, 4, 0, 0]}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? (theme === 'dark' ? '#10b981' : '#059669') : (theme === 'dark' ? '#f43f5e' : '#e11d48')} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {isCollapsed && (
        <div className="flex items-center justify-center h-full text-xs text-zinc-500 italic">
          {t.collapsed_msg}
        </div>
      )}
    </div>
  );
}
