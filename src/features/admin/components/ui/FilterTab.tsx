import React from 'react';

interface FilterTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export const FilterTab = ({ label, active, onClick }: FilterTabProps) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
      active 
      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
    }`}
    type="button"
  >
    {label}
  </button>
);