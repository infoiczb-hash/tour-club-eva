"use client";

import React, { useState, useEffect } from 'react';
import { AlignJustify, ArrowUp } from 'lucide-react';
import { clsx } from 'clsx';

export default function TourStickyNav() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 🔥 УМЕНЬШИЛ ПОРОГ с 600 до 100.
      // Теперь меню появится, как только вы начнете немного скроллить.
      const show = window.scrollY > 100;
      setIsVisible(show);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      // Добавил z-[100], чтобы оно было выше всего на свете (кроме модалки)
      className={clsx(
        "fixed top-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-md border-b border-white/10 transition-transform duration-300 ease-in-out shadow-2xl",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        <button onClick={scrollToTop} className="flex items-center gap-2 text-white font-bold uppercase hover:text-teal-400 transition-colors">
           <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowUp size={16} />
           </div>
           <span className="hidden md:inline text-xs tracking-widest">Наверх</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { id: 'about', label: 'Описание' },
            { id: 'program', label: 'Программа' },
            { id: 'gallery', label: 'Фото' },
            { id: 'dates', label: 'Даты' },
            { id: 'faq', label: 'FAQ' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-xs font-bold text-slate-400 hover:text-teal-400 hover:bg-white/5 px-3 py-2 rounded-lg transition-all uppercase tracking-wide"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="md:hidden text-white p-2">
           <AlignJustify />
        </button>

      </div>
    </header>
  );
}