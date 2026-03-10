"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';

// Типы уведомлений
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Провайдер
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    // Создаем уникальный ID
    const id = Math.random().toString(36).substring(2, 9);
    
    // Добавляем уведомление
    setToasts((prev) => [...prev, { id, message, type }]);

    // Удаляем через 4 секунды
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* КОНТЕЙНЕР УВЕДОМЛЕНИЙ (FIXED PORTAL) */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto min-w-[300px] max-w-sm w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-start gap-3 backdrop-blur-md"
            >
              {/* Иконка */}
              <div className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-teal-500" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              </div>

              {/* Текст */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">
                  {toast.type === 'success' ? 'Успешно' : toast.type === 'error' ? 'Ошибка' : 'Информация'}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-400 leading-snug">
                  {toast.message}
                </p>
              </div>

              {/* Кнопка закрытия */}
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};