"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { sendJoinTeamAction } from "@/features/admin/actions";

interface JoinTeamModalProps {
  open: boolean;
  onClose: () => void;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function JoinTeamModal({ open, onClose }: JoinTeamModalProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', telegram: '' });
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Блокировка прокрутки body при открытии модалки
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Автофокус на первое поле
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  const handleClose = () => {
    if (status === 'loading') return; // Не закрываем во время отправки
    setStatus('idle');
    setError(null);
    setFormData({ name: '', telegram: '' });
    onClose();
  };

  const validateTelegram = (value: string): boolean => {
    // Telegram username: начинается с @ или без, 5-32 символа, только латиница, цифры, подчёркивания
    const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
    return telegramRegex.test(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Сбрасываем ошибку при вводе
    if (error) setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Валидация
    if (formData.name.trim().length < 2) {
      setError('Имя должно содержать минимум 2 символа');
      return;
    }

    if (!validateTelegram(formData.telegram)) {
      setError('Укажите корректный Telegram (например: @username или username)');
      return;
    }

    setStatus('loading');
    setError(null);

    const submitData = new FormData();
    submitData.append('name', formData.name.trim());
    submitData.append('telegram', formData.telegram.trim().replace(/^@/, '')); // Убираем @ если есть

    try {
      const res = await sendJoinTeamAction(Object.fromEntries(submitData));
      
      if (res.success) {
        setStatus('success');
        // Закрываем модалку через 2 секунды после успеха
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setStatus('error');
        setError(res.error || 'Не удалось отправить заявку. Попробуйте позже');
      }
    } catch (err) {
      setStatus('error');
      setError('Произошла ошибка. Проверьте подключение к интернету');
    }
  }

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Backdrop с blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50 cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg pointer-events-auto"
            >
              {/* Светящийся эффект вокруг модалки */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent rounded-3xl blur-2xl" aria-hidden="true" />

              {/* Основной контент */}
              <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                {/* Декоративный градиент сверху */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500" aria-hidden="true" />
                
                <div className="p-6 md:p-8 lg:p-10">
                  {/* Кнопка закрытия */}
                  <button
                    onClick={handleClose}
                    disabled={status === 'loading'}
                    aria-label="Закрыть форму"
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  </button>

                  {/* Условный рендер: форма / успех */}
                  <AnimatePresence mode="wait">
                    {status === 'success' ? (
                      // Экран успеха
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                          className="inline-flex items-center justify-center w-20 h-20 bg-teal-500/20 rounded-full mb-6"
                        >
                          <CheckCircle2 className="w-10 h-10 text-teal-400" />
                        </motion.div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                          Заявка отправлена!
                        </h3>
                        <p className="text-slate-300 text-sm md:text-base">
                          Мы свяжемся с тобой в Telegram в ближайшее время
                        </p>
                      </motion.div>
                    ) : (
                      // Форма
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {/* Заголовок */}
                        <div className="mb-6 md:mb-8">
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <span className="inline-block text-teal-400 text-xs font-bold tracking-[0.3em] mb-2 uppercase">
                              Присоединяйся
                            </span>
                          </motion.div>
                          <motion.h3
                            id="modal-title"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight"
                          >
                            Стань частью{" "}
                            <span className="text-teal-400">команды мечты</span>
                          </motion.h3>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-sm md:text-base leading-relaxed"
                          >
                            Оставь контакты, и мы обсудим, как ты можешь изменить 
                            жизнь людей через горы
                          </motion.p>
                        </div>

                        {/* Форма */}
                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                          {/* Поле имени */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                          >
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                              Как тебя зовут?
                            </label>
                            <input
                              ref={firstInputRef}
                              id="name"
                              name="name"
                              type="text"
                              required
                              minLength={2}
                              maxLength={50}
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Иван Петров"
                              disabled={status === 'loading'}
                              className="w-full px-4 py-3 md:py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </motion.div>

                          {/* Поле Telegram */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <label htmlFor="telegram" className="block text-sm font-semibold text-slate-300 mb-2">
                              Твой Telegram
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                                @
                              </span>
                              <input
                                id="telegram"
                                name="telegram"
                                type="text"
                                required
                                value={formData.telegram}
                                onChange={handleInputChange}
                                placeholder="username"
                                disabled={status === 'loading'}
                                className="w-full pl-8 pr-4 py-3 md:py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5">
                              Без пробелов, 5-32 символа
                            </p>
                          </motion.div>

                          {/* Ошибка */}
                          <AnimatePresence>
                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                              >
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300">{error}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Кнопка отправки */}
                          <motion.button
                            type="submit"
                            disabled={status === 'loading'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                            whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                            className="group/btn w-full relative overflow-hidden px-6 py-3 md:py-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl font-bold text-slate-950 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30"
                          >
                            {/* Анимированный блик */}
                            {status !== 'loading' && (
                              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" aria-hidden="true" />
                            )}

                            <span className="relative flex items-center justify-center gap-2 text-sm md:text-base tracking-wide">
                              {status === 'loading' ? (
                                <>
                                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Отправляем...
                                </>
                              ) : (
                                <>
                                  Отправить заявку
                                  <Send className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                                </>
                              )}
                            </span>
                          </motion.button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
