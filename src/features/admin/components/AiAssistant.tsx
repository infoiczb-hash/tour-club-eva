"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, Trash2, MessageSquare } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { performAiTask } from "@/features/admin/actions/ai";

// Тип сообщения для локального стейта
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привет! Я твой AI-помощник. Чем помочь сегодня? Идеи для туров? Контент-план?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    
    // Добавляем сообщение пользователя в чат сразу
    const newHistory = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(newHistory);
    setIsLoading(true);

    // Отправляем запрос к AI
    // ВАЖНО: Мы передаем всю историю, чтобы AI помнил контекст
    const res = await performAiTask({ 
  mode: 'chat', 
  messages: newHistory.slice(1) // убрать начальное приветствие из контекста
});

    setIsLoading(false);

    if (res.success) {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data as string }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Извини, произошла ошибка. Попробуй еще раз.' }]);
    }
  };

  // Очистка истории (Сброс контекста)
  const handleClearHistory = () => {
    if (confirm('Очистить историю переписки? AI забудет контекст беседы.')) {
      setMessages([
        { role: 'assistant', content: 'Контекст очищен. Начнем с чистого листа! О чем поговорим?' }
      ]);
    }
  };

  return (
    <>
      {/* КНОПКА ОТКРЫТИЯ (Плавающая) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-violet-600 text-white p-4 rounded-full shadow-2xl shadow-violet-600/40 hover:bg-violet-700 transition-colors border-4 border-white dark:border-slate-800"
          >
            <Bot size={28} />
            {/* Индикатор уведомления (декор) */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ОКНО ЧАТА */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // Мобильная адаптивность: на телефоне inset-0 (фулскрин), на десктопе - плавающее окно
            className="fixed inset-0 md:inset-auto md:bottom-8 md:right-8 z-50 flex flex-col bg-white dark:bg-slate-950 md:w-96 md:h-[600px] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            
            {/* HEADER */}
            <div className="p-4 bg-violet-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                    <Bot size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-none">EVA AI</h3>
                    <p className="text-[10px] text-violet-200 font-medium opacity-80 mt-0.5">Brain Mode</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Кнопка "Метла" (Очистить) */}
                <button 
                  onClick={handleClearHistory}
                  title="Очистить историю и забыть контекст"
                  className="p-2 hover:bg-white/20 rounded-lg transition text-violet-100 hover:text-white"
                >
                  <Trash2 size={18} />
                </button>
                
                {/* Кнопка Закрыть */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scroll-smooth"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-violet-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {/* Если это ассистент, добавляем иконку */}
                    {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                            <Sparkles size={10}/> AI Thinking
                        </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                   </div>
                </div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 pb-safe">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Спроси меня о чем угодно..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-slate-400"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-lg shadow-violet-500/20"
              >
                <Send size={18} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}