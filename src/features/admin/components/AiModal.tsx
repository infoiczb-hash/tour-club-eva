"use client";

import React, { useState } from 'react';
import { X, Sparkles, Loader2, Wand2 } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { performAiTask, type PerformAiTaskResult } from '@/features/admin/actions/ai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: any) => void;
}

export default function AiModal({ isOpen, onClose, onApply }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    
    const res = await performAiTask({ mode: 'generate_tour', prompt }) as PerformAiTaskResult;
    
    setLoading(false);
 if (res.success) {
      onApply(res.data);
      onClose();
      setPrompt('');
    } else {
      // res.error уже содержит дружественное сообщение из performAiTask
      alert(res.error || 'Не удалось сгенерировать тур. Попробуйте позже.');
    }
  };

  if (!isOpen) return null;

  return (
    // ✅ ИСПРАВЛЕНИЕ: z-[100] гарантирует, что это окно будет ВЫШЕ формы создания тура (у которой z-50)
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Кликабельный оверлей для закрытия (по желанию) */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-violet-600" size={20}/> 
            AI Генератор Тура
          </h3>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="text-slate-800 hover:text-slate-800 dark:hover:text-slate-800 transition p-1 hover:bg-slate-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-800 dark:text-slate-800">
            Опишите в двух словах, какой тур вы хотите создать (локация, сложность, фишки), и AI подготовит черновик.
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none resize-none dark:text-white placeholder:text-slate-800 transition-all"
            placeholder="Например: Семейный поход на байдарках по Днестру на 2 дня с ночевкой в палатках и мастер-классом по выживанию..."
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            disabled={loading}
            className="bg-white hover:bg-slate-100"
          >
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerate} 
            disabled={loading || !prompt}
            isLoading={loading}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/20 px-6 border-none"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Wand2 className="mr-2" size={16}/>}
            Сгенерировать
          </Button>
        </div>

      </div>
    </div>
  );
}