import React from 'react';

interface SidebarNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export const SidebarNavItem = ({ active, onClick, icon, label, badge }: SidebarNavItemProps) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
      active 
      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
      : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
    }`}
    type="button"
  >
    <span className={active ? '' : 'group-hover:scale-110 transition-transform'}>
      {icon}
    </span>
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="ml-auto bg-rose-500 text-white text-[12px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
        {badge}
      </span>
    )}
  </button>
);