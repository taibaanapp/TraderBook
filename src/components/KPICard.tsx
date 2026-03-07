import React from 'react';
import { cn } from '../utils/cn';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  theme?: 'light' | 'dark';
}

export function KPICard({ title, value, description, trend, className, theme = 'light' }: KPICardProps) {
  return (
    <div className={cn(
      "p-4 rounded-xl border shadow-sm flex flex-col",
      theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200",
      className
    )}>
      <h3 className={cn("text-sm font-medium mb-1", theme === 'dark' ? "text-zinc-400" : "text-gray-500")}>{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-2xl font-bold",
          trend === 'up' ? "text-emerald-500" : trend === 'down' ? "text-red-500" : (theme === 'dark' ? "text-zinc-100" : "text-gray-900")
        )}>
          {value}
        </span>
      </div>
      {description && <p className={cn("text-xs mt-2", theme === 'dark' ? "text-zinc-500" : "text-gray-400")}>{description}</p>}
    </div>
  );
}
