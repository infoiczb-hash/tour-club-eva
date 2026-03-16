"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Tour } from '@/features/tours/types';

interface TourFAQProps {
  tour: Tour;
}

export default function TourFAQ({ tour }: TourFAQProps) {
  const faqItems = React.useMemo(() => {
    if (!tour.faq) return [];
    if (Array.isArray(tour.faq)) return tour.faq;
    
    // Безопасная проверка на legacy-структуру без конфликтов типизации
    const rawFaq = tour.faq as Record<string, unknown>;
    if (typeof rawFaq === 'object' && rawFaq !== null && 'items' in rawFaq) {
      return Array.isArray(rawFaq.items) ? rawFaq.items : [];
    }
    
    return [];
  }, [tour.faq]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqItems.length === 0) return null;

  return (
    <section className="scroll-mt-24 mb-12 animate-in fade-in duration-500" id="faq">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <HelpCircle size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Частые вопросы
        </h2>
      </div>

      <div className="space-y-3">
        {faqItems.map((item: any, index: number) => {
          const isOpen = isPrinting || openIndex === index;
          const question = item.question || item.q || "Вопрос без заголовка";
          const answer = item.answer || item.a || "Ответ уточняется...";

          return (
            <div 
              key={index}
              className={clsx(
                // ✅ ИСПРАВЛЕНИЕ: transition вместо transition-all
                "rounded-2xl border transition duration-300 overflow-hidden print:border-slate-300 print:bg-transparent print:shadow-none print:break-inside-avoid print:mb-4",
                isOpen && !isPrinting
                  ? "bg-slate-900 border-teal-500/30 shadow-lg" 
                  : "bg-slate-900/40 border-white/5 hover:border-white/10"
              )}
            >
              <button
                  onClick={() => toggleItem(index)}
                  aria-expanded={openIndex === index}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
              >
                <span className={clsx(
                  "text-base md:text-lg font-bold pr-8 transition-colors print:text-black",
                  isOpen && !isPrinting ? "text-teal-400" : "text-white group-hover:text-teal-200"
                )}>
                  {question}
                </span>
                
                <div className={clsx(
                  // ✅ ИСПРАВЛЕНИЕ: transition вместо transition-all
                  "w-8 h-8 rounded-full flex items-center justify-center transition duration-300 shrink-0 print:hidden",
                  isOpen && !isPrinting ? "bg-teal-500 text-slate-900 rotate-180" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                )}>
                  {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </div>
              </button>

              {/* ✅ ИСПРАВЛЕНИЕ: transition-[grid-template-rows,opacity] для честного GPU-аккордеона */}
              <div className={clsx(
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out print:block",
                  isOpen ? "grid-rows-[1fr] opacity-100 print:h-auto print:opacity-100" : "grid-rows-[0fr] opacity-0"
              )}>
                  <div className="overflow-hidden">
                    <div className="px-5 md:px-6 pb-6 pt-0">
                      <div className="pt-4 border-t border-white/5 print:border-slate-200 prose prose-invert prose-sm max-w-none text-slate-300 print:text-black font-light leading-relaxed whitespace-pre-line">
                        {answer}
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}