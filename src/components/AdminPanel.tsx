import React, { useState, useEffect } from 'react';
import { X, Activity, Globe, Database, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.admin;

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

interface RequestStat {
  domain: string;
  purpose: string;
  day: string;
  count: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, theme }) => {
  const [stats, setStats] = useState<RequestStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/external-requests');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        "w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden",
        isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
      )}>
        <div className={cn(
          "flex items-center justify-between p-6 border-b",
          isDark ? "border-zinc-800" : "border-zinc-200"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-500 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className={cn("text-xl font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                {t.title}
              </h2>
              <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
                {t.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn("p-4 rounded-xl border", isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className={cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>{t.total_domains}</span>
                  </div>
                  <div className={cn("text-2xl font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                    {new Set(stats.map(s => s.domain)).size}
                  </div>
                </div>
                <div className={cn("p-4 rounded-xl border", isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className={cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>{t.total_requests}</span>
                  </div>
                  <div className={cn("text-2xl font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                    {stats.reduce((acc, curr) => acc + curr.count, 0)}
                  </div>
                </div>
                <div className={cn("p-4 rounded-xl border", isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className={cn("text-sm font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>{t.active_days}</span>
                  </div>
                  <div className={cn("text-2xl font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                    {new Set(stats.map(s => s.day)).size}
                  </div>
                </div>
              </div>

              <div className={cn("rounded-xl border overflow-hidden", isDark ? "border-zinc-800" : "border-zinc-200")}>
                <table className="w-full text-left text-sm">
                  <thead className={cn(
                    "text-xs uppercase",
                    isDark ? "bg-zinc-800/50 text-zinc-400" : "bg-zinc-50 text-zinc-500"
                  )}>
                    <tr>
                      <th className="px-6 py-3 font-medium">{t.date}</th>
                      <th className="px-6 py-3 font-medium">{t.domain}</th>
                      <th className="px-6 py-3 font-medium">{t.purpose}</th>
                      <th className="px-6 py-3 font-medium text-right">{t.requests}</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDark ? "divide-zinc-800" : "divide-zinc-200")}>
                    {stats.map((stat, idx) => (
                      <tr key={idx} className={cn(
                        "transition-colors",
                        isDark ? "hover:bg-zinc-800/30" : "hover:bg-zinc-50"
                      )}>
                        <td className={cn("px-6 py-4 whitespace-nowrap", isDark ? "text-zinc-300" : "text-zinc-700")}>
                          {stat.day}
                        </td>
                        <td className={cn("px-6 py-4", isDark ? "text-zinc-100" : "text-zinc-900")}>
                          {stat.domain}
                        </td>
                        <td className={cn("px-6 py-4", isDark ? "text-zinc-400" : "text-zinc-500")}>
                          {stat.purpose}
                        </td>
                        <td className={cn("px-6 py-4 text-right font-mono", isDark ? "text-zinc-300" : "text-zinc-700")}>
                          {stat.count}
                        </td>
                      </tr>
                    ))}
                    {stats.length === 0 && (
                      <tr>
                        <td colSpan={4} className={cn("px-6 py-8 text-center", isDark ? "text-zinc-500" : "text-zinc-400")}>
                          {t.no_requests}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
