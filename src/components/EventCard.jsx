import React, { useState } from 'react';
import { MapPin, ArrowRight, Calendar } from 'lucide-react';

const EventCard = ({ event, onSelect, index, t }) => {
  const [hover, setHover] = useState(false);

  // --- ДАТЫ ---
  const dateObj = new Date(event.date);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = dateObj.toLocaleString('ru-RU', { month: 'short' }).replace('.', '');
  
  // Формируем строку для зеленой полоски внизу: "06 мар 07:00"
  const dateString = `${day} ${month} ${event.time?.slice(0,5)}`;

  // --- ЦВЕТА КАТЕГОРИЙ (ВЕРХ СЛЕВА) ---
  const typeColors = {
      'water': 'bg-blue-500',
      'hiking_1': 'bg-green-600',
      'kids': 'bg-yellow-500 text-black',
      'weekend': 'bg-orange-500',
      'expedition': 'bg-indigo-600',
      'default': 'bg-teal-600'
  };
  const currentTypeColor = typeColors[event.type] || typeColors.default;

  // --- ЦВЕТА МЕТОК (НИЗ СЛЕВА) ---
  const labelColors = {
      'эксклюзив': 'bg-[#D946EF]',
      'новинка': 'bg-emerald-500',
      'топ': 'bg-red-500',
      'хит': 'bg-orange-500',
      'для новичков': 'bg-cyan-500'
  };
  const labelBg = labelColors[event.label?.toLowerCase()] || 'bg-gray-800';

  return (
    <article 
        className="bg-white rounded-[24px] shadow-lg hover:shadow-2xl transition-all duration-500 group flex flex-col h-full relative transform hover:-translate-y-1 font-sans border border-gray-100 overflow-hidden"
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
        style={{ animationDelay: `${index * 100}ms` }} 
    >
      {/* ================= ФОТО (Кликабельно) ================= */}
      <div 
        onClick={() => onSelect(event)}
        className="relative h-64 shrink-0 cursor-pointer"
      >
        <img 
            src={event.image} 
            alt={event.title} 
            className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* 1. СЛЕВА СВЕРХУ: Вид тура */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold uppercase tracking-wider shadow-md ${currentTypeColor}`}>
            {t.filters[event.type] || event.type}
        </div>

        {/* 2. СПРАВА СВЕРХУ: Зеленый квадрат (СВИСАЕТ) */}
        {/* Изменено: top-0, rounded-b-[16px], убрана рамка */}
        <div className="absolute top-0 right-6 bg-[#2E8B57] text-white rounded-b-[16px] shadow-md flex flex-col items-center justify-center w-12 h-14 pt-1 z-20">
            <span className="text-xl font-bold font-condensed leading-none mt-0.5">{day}</span>
            <span className="text-[10px] font-bold uppercase leading-none mb-1 opacity-90">{month}</span>
        </div>

        {/* 3. СЛЕВА ВНИЗУ: Метка */}
        {event.label && (
             <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-md text-white text-[10px] font-bold uppercase tracking-wider shadow-lg ${labelBg}`}>
                 {event.label}
             </div>
        )}

        {/* 4. СПРАВА ВНИЗУ: Осталось мест (ПОЛНЫЙ ТЕКСТ) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${event.spotsLeft > 5 ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`}></div>
            {/* Изменено: Полный текст "Осталось X мест" */}
            <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                Осталось {event.spotsLeft} мест
            </span>
        </div>
      </div>

      {/* ================= КОНТЕНТ ================= */}
      <div className="px-5 pb-5 pt-3 flex flex-col flex-grow bg-white relative">
        
        {/* Локация */}
        <div className="flex items-center gap-1.5 text-gray-400 text-[12px] font-bold uppercase tracking-wide mb-2">
            <MapPin size={14} className="text-teal-600"/>
            <span className="truncate">{event.location}</span>
        </div>

        {/* Заголовок */}
        <h3 className="text-2xl font-condensed font-bold text-[#0F172A] uppercase leading-tight mb-2 group-hover:text-teal-600 transition-colors">
            {event.title}
        </h3>

        {/* Подзаголовок */}
        <p className="text-sm text-gray-500 font-light leading-snug mb-4 line-clamp-3">
            {event.subtitle || event.description || 'Описание уточняется...'}
        </p>
        
        {/* ЗЕЛЕНАЯ ПОЛОСКА (Только дата и время) */}
        {/* Изменено: mb-5 -> mb-2 (уменьшен отступ), убрана длительность */}
        <div className="mt-auto mb-2 bg-[#2E8B57]/10 border border-[#2E8B57]/20 text-[#2E8B57] py-1.5 px-3 rounded-lg flex items-center gap-2 text-[13px] font-bold w-fit">
            <Calendar size={15} />
            <span>{dateString}</span>
        </div>
        
        {/* ФУТЕР */}
        <div className="flex items-end justify-between border-t border-gray-50 pt-3 mt-1">
            
            {/* Цена */}
            <div className="flex flex-col justify-center">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-gray-400 font-bold uppercase">от</span>
                    <span className="text-3xl font-condensed font-bold text-[#2E8B57] leading-none">
                        {event.price.adult} ₽
                    </span>
                </div>
                 {event.priceOld && (
                    <span className="text-xs text-gray-300 line-through font-medium ml-4">
                        {event.priceOld} ₽
                    </span>
                )}
            </div>

            {/* Кнопка */}
            <button 
                onClick={() => onSelect(event)}
                className="w-11 h-11 rounded-full bg-[#117CA6] text-white flex items-center justify-center shadow-md hover:bg-[#0D6587] hover:scale-105 transition-all active:scale-95 cursor-pointer"
            >
                <ArrowRight size={22} strokeWidth={2.5} />
            </button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
