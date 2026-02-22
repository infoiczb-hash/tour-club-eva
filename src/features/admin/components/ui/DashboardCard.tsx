import React from 'react';

interface DashboardCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string; // Например: "bg-slate-100 text-slate-600"
}

export const DashboardCard = ({ label, value, sub, icon, color }: DashboardCardProps) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-start justify-between mb-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-black text-slate-900 dark:text-white">
      {value}
    </div>
    {sub && (
      <div className="text-[10px] text-slate-400 font-bold mt-1">
        {sub}
      </div>
    )}
  </div>
);