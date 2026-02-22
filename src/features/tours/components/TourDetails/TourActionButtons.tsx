"use client";

import React, { useState } from 'react';
import { Share2, Printer, MessageCircle, MousePointerClick, Check } from 'lucide-react';
import { Tour } from '@/features/tours/types';
// ✅ Импорт нового Хаба
import ContactHubModal from "@/components/modals/ContactHubModal";

interface TourActionButtonsProps {
  tour: Tour;
}

export default function TourActionButtons({ tour }: TourActionButtonsProps) {
  const [isCopied, setIsCopied] = useState(false);
  // ✅ Состояние для открытия модалки
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Логика "Поделиться"
  const handleShare = async () => {
    const shareData = {
      title: tour.title,
      text: `Посмотри этот тур: ${tour.title}`,
      url: window.location.href,
    };

    // Если браузер поддерживает нативный шеринг (мобилки)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Иначе просто копируем ссылку
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Логика "Печать / PDF"
  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="scroll-mt-24 mb-12" id="actions">
      
      {/* 1. ЗАГОЛОВОК С ИКОНКОЙ */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <MousePointerClick size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase">
           Другие действия
        </h2>
      </div>

      {/* 2. СЕТКА КНОПОК */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* КНОПКА: ПОДЕЛИТЬСЯ */}
        <button 
          onClick={handleShare}
          className="group relative flex items-center gap-4 p-5 bg-slate-900 border border-white/5 hover:border-teal-500/30 rounded-2xl transition-all hover:bg-slate-800 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
             {isCopied ? <Check size={20} /> : <Share2 size={20} />}
          </div>
          <div>
             <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">
               {isCopied ? 'Ссылка скопирована' : 'Позвать друзей'}
             </span>
             <span className="block text-white font-bold text-sm">
               Поделиться туром
             </span>
          </div>
        </button>

        {/* КНОПКА: PDF / ПЕЧАТЬ */}
        <button 
          onClick={handlePrint}
          className="group flex items-center gap-4 p-5 bg-slate-900 border border-white/5 hover:border-teal-500/30 rounded-2xl transition-all hover:bg-slate-800 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform shrink-0">
             <Printer size={20} />
          </div>
          <div>
             <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">
               Документ
             </span>
             <span className="block text-white font-bold text-sm">
               Версия для печати / PDF
             </span>
          </div>
        </button>

        {/* КНОПКА: ВОПРОСЫ (ОБНОВЛЕНО) */}
        <button 
          onClick={() => setIsContactOpen(true)}
          className="group flex items-center gap-4 p-5 bg-slate-900 border border-white/5 hover:border-teal-500/30 rounded-2xl transition-all hover:bg-slate-800 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shrink-0">
             <MessageCircle size={20} />
          </div>
          <div>
             <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">
               Есть вопросы по туру?
             </span>
             <span className="block text-white font-bold text-sm">
               Напишите нам
             </span>
          </div>
        </button>

      </div>

      {/* ✅ ПОДКЛЮЧЕНИЕ МОДАЛКИ С КОНТЕКСТОМ */}
      <ContactHubModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        initialTab="TOUR"
        tourContext={tour.title} // Передаем название тура
      />
    </section>
  );
}