import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '@/shared/ui/Button';

interface GuideItem {
  id: string;
  name: string;
  role: string;
  image?: string | null;
}

interface GuidesTabProps {
  guides: GuideItem[];
  onAdd: () => void;
  onEdit: (guide: GuideItem) => void;
  onDelete: (id: string) => void;
}

export default function GuidesTab({ guides, onAdd, onEdit, onDelete }: GuidesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold uppercase dark:text-white">Наша команда</h2>
        <Button onClick={onAdd} variant="primary" className="hidden md:flex">
          <Plus size={18} className="mr-2"/> Добавить гида
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map(g => (
          <div key={g.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 relative group shadow-sm hover:shadow-md transition-all">
            <img 
              src={g.image || '/placeholder-user.jpg'} 
              className="w-14 h-14 rounded-full object-cover bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm" 
              alt={g.name}
            />
            <div className="flex-1">
              <div className="font-bold text-lg dark:text-white">{g.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {g.role}
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(g)} 
                className="text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Edit size={18}/>
              </button>
              <button 
                onClick={() => onDelete(g.id)} 
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}