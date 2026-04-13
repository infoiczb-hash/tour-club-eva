"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, Trash2 } from "lucide-react";
import { performAiTask } from "@/features/admin/actions/ai";

// Тип сообщения для локального стейта
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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

  // ✅ ПАТТЕРН: Задержка размонтирования для CSS-анимации исчезновения
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      const timer = setTimeout(() => setIsMounted(false), 200); // время анимации
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    
    const newHistory = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(newHistory);
    setIsLoading(true);

    const res = await performAiTask({ 
      mode: 'chat', 
      messages: newHistory.slice(1) 
    });

    setIsLoading(false);

    if (res.success) {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data as string }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Извини, произошла ошибка. Попробуй еще раз.' }]);
    }
  };

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
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-violet-600 text-white p-4 rounded-full shadow-2xl shadow-violet-600/40 hover:bg-violet-700 transition-all border-4 border-white dark:border-slate-800 duration-300 ease-out ${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
      >
        <Bot size={28} />
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
      </button>

      {/* ОКНО ЧАТА */}
      {isMounted && (
        <div
          className={`fixed inset-0 md:inset-auto md:bottom-8 md:right-8 z-50 flex flex-col bg-white dark:bg-slate-950 md:w-96 md:h-[600px] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden origin-bottom-right transition-all duration-200 ease-out ${
            isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95 pointer-events-none"
          }`}
        >
          
          {/* HEADER */}
          <div className="p-4 bg-violet-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-sm leading-none">EVA AI</h3>
                  <p className="text-[12px] text-violet-200 font-medium opacity-80 mt-0.5">Brain Mode</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={handleClearHistory} title="Очистить историю" className="p-2 hover:bg-white/20 rounded-lg transition text-violet-100 hover:text-white">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MESSAGES AREA */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                  {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1 opacity-50 text-[12px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          <Sparkles size={10}/> AI Thinking
                      </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

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
              className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-slate-800"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-lg shadow-violet-500/20"
            >
              <Send size={18} />
            </button>
          </div>

        </div>
      )}
    </>
  );
}