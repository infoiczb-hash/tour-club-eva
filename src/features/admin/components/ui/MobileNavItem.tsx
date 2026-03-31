import React from 'react';

interface MobileNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export const MobileNavItem = ({ active, onClick, icon, label, badge }: MobileNavItemProps) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 w-16 relative ${
      active ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-400'
    }`}
    type="button"
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"/>
      )}
    </div>
    <span className="text-[10px] font-bold tracking-tight">
      {label}
    </span>
  </button>
);