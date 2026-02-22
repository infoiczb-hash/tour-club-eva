"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
// 🔥 Импортируем тип Tour
import { Tour } from '@/features/tours/types';

interface TourFAQProps {
  tour: Tour;
}

export default function TourFAQ({ tour }: TourFAQProps) {
  // 1. Безопасное извлечение данных
  // В базе данных faq может лежать как JSON-объект, массив или null
  const faqItems = React.useMemo(() => {
    if (!tour.faq) return [];
    if (Array.isArray(tour.faq)) return tour.faq;
    if (typeof tour.faq === 'object' && tour.faq.items) return tour.faq.items;
    return [];
  }, [tour.faq]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Если вопросов нет, просто не рисуем блок
  if (faqItems.length === 0) return null;

  return (
    <section className="scroll-mt-24 mb-12" id="faq">
      
      {/* ЗАГОЛОВОК */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <HelpCircle size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Частые вопросы
        </h2>
      </div>

      {/* СПИСОК ВОПРОСОВ (Аккордеон) */}
      <div className="space-y-3">
        {faqItems.map((item: any, index: number) => {
          const isOpen = openIndex === index;
          const question = item.question || item.q || "Вопрос без заголовка";
          const answer = item.answer || item.a || "Ответ уточняется...";

          return (
            <div 
              key={index}
              className={clsx(
                "rounded-2xl border transition-all duration-300 overflow-hidden",
                isOpen 
                  ? "bg-slate-900 border-teal-500/30 shadow-lg" 
                  : "bg-slate-900/40 border-white/5 hover:border-white/10"
              )}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
              >
                <span className={clsx(
                  "text-base md:text-lg font-bold pr-8 transition-colors",
                  isOpen ? "text-teal-400" : "text-white group-hover:text-teal-200"
                )}>
                  {question}
                </span>
                
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                  isOpen ? "bg-teal-500 text-slate-900 rotate-180" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                )}>
                  {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-5 md:px-6 pb-6 pt-0">
                      <div className="pt-4 border-t border-white/5 prose prose-invert prose-sm max-w-none text-slate-300 font-light leading-relaxed whitespace-pre-line">
                        {answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </section>
  );
}