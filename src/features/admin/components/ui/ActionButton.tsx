import React from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  color?: string; // Например: "text-red-500"
}

export const ActionButton = ({ icon, onClick, title, color }: ActionButtonProps) => {
  const baseColor = "text-slate-600 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-teal-400";
  
  return (
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        onClick(); 
      }} 
      title={title} 
      className={`p-2 rounded-lg transition-colors ${color || baseColor}`}
      type="button"
    >
      {icon}
    </button>
  );
};