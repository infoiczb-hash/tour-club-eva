import React, { useState } from 'react';
import { MapPin, ArrowRight, Calendar, Clock, User } from 'lucide-react';

const EventCard = ({ event, onSelect, index, t }) => {
  const [hover, setHover] = useState(false);

  // --- ДАТЫ ---
  const dateObj = new Date(event.date);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = dateObj.toLocaleString('ru-RU', { month: 'short' }).replace('.', '');
  
  // Формируем строку для зеленой полоски: "06 мар 07:00"
  const dateString = `${day} ${month} ${event.time?.slice(0,5)}`;
  // Если есть длительность, добавляем её: "06 мар 07:00 • 2 дня"
  const fullDateString = event.duration ? `${dateString} • ${event.duration}` : dateString;

  // --- ЦВЕТА КАТЕГОРИЙ (ВЕРХ СЛЕВА) ---
  // На воде, 1 день, Подросткам, Экспедиции
  const typeColors = {
      'water': 'bg-blue-500',       // На воде
      'hiking_1': 'bg-green-600',   // Тур на 1 день
      'kids': 'bg-yellow-500 text-black', // Подросткам (желтый, текст черный)
      'weekend': 'bg-orange-500',   // 2-3 дня
      'expedition': 'bg-indigo-600',// Экспедиции
      'default': 'bg-teal-600'
  };
  const currentTypeColor = typeColors[event.type] || typeColors.default;

  // --- ЦВЕТА МЕТОК (НИЗ СЛЕВА) ---
  // Новинка, Эксклюзив
  const labelColors = {
      'эксклюзив': 'bg-[#D946EF]', // Розовый
      'новинка': 'bg-emerald-500', // Изумрудный
      'топ': 'bg-red-500',         // Красный
      'хит': 'bg-orange-500',
      'для новичков': 'bg-cyan-500'
  };
  const labelBg = labelColors[event.label?.toLowerCase()] || 'bg-gray-800';

  return (
    <article 
        className="bg-white rounded-[24px] shadow-lg hover:shadow-2xl transition-all duration-500 group flex flex-col h-full relative transform hover:-translate-y-1 font-sans border border-gray-100 overflow-visible"
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
        style={{ animationDelay: `${index * 100}ms` }} 
    >
      {/* ================= ФОТО (Кликабельно) ================= */}
      {/* cursor-pointer и onClick добавляем сюда */}
      <div 
        onClick={() => onSelect(event)}
        className="relative h-64 shrink-0 m-2 rounded-[20px] overflow-hidden cursor-pointer"
      >
        <img 
            src={event.image} 
            alt={event.title} 
            className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} 
        />
        {/* Градиент */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* 1. СЛЕВА СВЕРХУ: Вид тура (Цветной бейдж) */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold uppercase tracking-wider shadow-md ${currentTypeColor}`}>
            {t.filters[event.type] || event.type}
        </div>

        {/* 2. СПРАВА СВЕРХУ: Зеленый квадрат (Число + Месяц) */}
        {/* Добавляем отрицательный margin или translate, чтобы он "вылезал" за границы, 
            но так как у нас padding m-2, он будет визуально на границе */}
        <div className="absolute -top-1 -right-1 bg-[#2E8B57] text-white rounded-xl shadow-lg flex flex-col items-center justify-center w-14 h-14 border-2 border-white z-20">
            <span className="text-xl font-bold font-condensed leading-none mt-1">{day}</span>
            <span className="text-[10px] font-bold uppercase leading-none mb-1 opacity-90">{month}</span>
        </div>

        {/* 3. СЛЕВА ВНИЗУ: Тип (Новинка/Эксклюзив) */}
        {event.label && (
             <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-md text-white text-[10px] font-bold uppercase tracking-wider shadow-lg ${labelBg}`}>
                 {event.label}
             </div>
        )}

        {/* 4. СПРАВА ВНИЗУ: Осталось мест */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${event.spotsLeft > 5 ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                Ост. {event.spotsLeft}
            </span>
        </div>
      </div>

      {/* ================= КОНТЕНТ ================= */}
      <div className="px-5 pb-6 pt-2 flex flex-col flex-grow bg-white rounded-b-[24px]">
        
        {/* 1. ЛОКАЦИЯ (Над заголовком) */}
        <div className="flex items-center gap-1.5 text-gray-400 text-[12px] font-bold uppercase tracking-wide mb-2">
            <MapPin size={14} className="text-teal-600"/>
            <span className="truncate">{event.location}</span>
        </div>

        {/* 2. ЗАГОЛОВОК (Caps lock, без обрезания) */}
        <h3 className="text-2xl font-condensed font-bold text-[#0F172A] uppercase leading-tight mb-2 group-hover:text-teal-600 transition-colors">
            {event.title}
        </h3>

        {/* 3. ПОДЗАГОЛОВОК (Тонкий шрифт, 2-3 строки) */}
        <p className="text-sm text-gray-500 font-light leading-snug mb-4 line-clamp-3">
            {event.subtitle || event.description || 'Описание уточняется...'}
        </p>
        
        {/* 4. ЗЕЛЕНАЯ ПОЛОСКА (Дата/Длительность) */}
        <div className="mt-auto mb-5 bg-[#2E8B57]/10 border border-[#2E8B57]/20 text-[#2E8B57] py-2 px-4 rounded-xl flex items-center gap-2 text-sm font-bold w-fit">
            <Calendar size={16} />
            <span>{fullDateString}</span>
        </div>
        
        {/* 5. ФУТЕР */}
        <div className="flex items-end justify-between border-t border-gray-100 pt-4 mt-2">
            
            {/* Слева: Цена ОТ */}
            <div className="flex flex-col">
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

            {/* Справа: Круглая кнопка */}
            <button 
                onClick={() => onSelect(event)}
                className="w-12 h-12 rounded-full bg-[#117CA6] text-white flex items-center justify-center shadow-lg hover:bg-[#0D6587] hover:scale-110 transition-all active:scale-95 cursor-pointer"
            >
                <ArrowRight size={24} strokeWidth={2.5} />
            </button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
