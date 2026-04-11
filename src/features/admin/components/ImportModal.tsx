"use client";

import React, { useState } from 'react';
import { X, FileDown, Loader2, Clipboard } from 'lucide-react';
import Button from '@/shared/ui/Button';
import { performAiTask } from '@/features/admin/actions/ai';

// ✅ ИСПРАВЛЕНО: Строгая типизация вместо any
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>) => void; 
}

export default function ImportModal({ isOpen, onClose, onImport }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!text.trim() || text.length < 10) return alert("Введите текст тура для импорта");
    
    setLoading(true);
    // Вызываем режим parse_tour_text (The Importer)
    const res = await performAiTask({ mode: 'parse_tour_text', text });
    setLoading(false);

    if (res.success) {
      // ✅ ИСПРАВЛЕНО: Безопасное приведение данных от AI к ожидаемому типу
      onImport(res.data as Record<string, unknown>); 
      onClose();
      setText(''); // Очищаем
    } else {
      alert("Ошибка импорта: " + res.error);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              <FileDown className="text-blue-600" size={20}/> 
              Импорт тура
            </h3>
            <p className="text-xs text-slate-600 font-medium">Вставьте любой текст (пост, PDF, сообщение)</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none dark:text-white placeholder:text-slate-600 transition-all"
              placeholder="Вставьте сюда описание тура:
— Название
— Даты
— Цены
— Программа...

AI сам разложит всё по полочкам."
            />
            {!text && (
              <button 
                onClick={handlePaste}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-600 flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Clipboard size={14}/> Вставить из буфера
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Отмена</Button>
          <Button 
            variant="primary" 
            onClick={handleImport} 
            disabled={loading || !text}
            isLoading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 px-6"
          >
            {loading ? 'Анализирую...' : '🚀 Распознать и заполнить'}
          </Button>
        </div>

      </div>
    </div>
  );
}