import React from 'react';

interface StatusSwitchProps {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  labelOn?: string;
  labelOff?: string;
}

export const StatusSwitch = ({ 
  active, 
  onClick, 
  labelOn = "ON", 
  labelOff = "OFF" 
}: StatusSwitchProps) => (
  <button 
    onClick={(e) => { 
      e.stopPropagation(); 
      onClick(e); 
    }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      active ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
    }`}
    title={active ? labelOn : labelOff}
    type="button"
  >
    <span 
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        active ? 'translate-x-6' : 'translate-x-1'
      }`} 
    />
  </button>
);