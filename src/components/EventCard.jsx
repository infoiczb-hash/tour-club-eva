import React, { useState } from 'react';
import { MapPin, ArrowRight, User, Clock } from 'lucide-react';
import Button from './ui/Button';

const EventCard = ({ event, onSelect, index, t }) => {
  const [hover, setHover] = useState(false);

  // --- ЛОГИКА ДАТЫ (ТОЛЬКО НАЧАЛО) ---
  const dateObj = new Date(event.date);
  const day = dateObj.getDate().toString().padStart(2, '0'); 
  // Месяц 3 буквы без точки (янв, фев, мар...)
  const month = dateObj.toLocaleString('ru-RU', { month: 'short' }).replace('.', ''); 

  // --- ЦВЕТА МЕТОК ---
  const labelColors = {
      'эксклюзив': 'bg-purple-600',
      'новинка': 'bg-green-500',
      'топ': 'bg-red-500',
      'хит': 'bg-orange-500',
      'для новичков': 'bg-blue-400'
  };
  const labelBg = labelColors[event.label?.toLowerCase()] || 'bg-teal-600';

  // Расчет процента заполненности для полоски (если захотим вернуть) или логики цвета
  const spotsTotal = event.spots || 20;
  
  return (
    <article 
        className="bg-white rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 group flex flex-col h-full overflow-hidden border border-gray-100 relative transform hover:-translate-y-1"
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
        style={{ animationDelay: `${index * 100}ms` }} 
    >
      {/* ================= ФОТО (ФАСАД) ================= */}
      <div className="relative h-60 shrink-0 overflow-hidden">
        
        {/* Картинка */}
        <img 
            src={event.image || 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95'} 
            alt={event.title} 
            className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} 
        />
        
        {/* Градиент для читаемости */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        {/* 1. Верх-Лево: ТИП ТУРА */}
        <div className="absolute top-5 left-5">
             <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">
                 {t.filters[event.type] || event.type}
             </span>
        </div>

        {/* 2. Верх-Право: КВАДРАТ ДАТЫ */}
        <div className="absolute top-5 right-5 bg-green-600 text-white rounded-xl shadow-lg flex flex-col items-center justify-center w-14 h-14 border border-white/10 z-10">
            <span className="text-xl font-bold leading-none mt-1">{day}</span>
            <span className="text-[10px] font-bold uppercase leading-none mb-1 opacity-90">{month}</span>
        </div>

        {/* 3. Низ-Лево: МЕТКА (Эксклюзив/Новинка) */}
        {event.label && (
             <div className={`absolute bottom-8 left-5 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg ${labelBg}`}>
                 {event.label}
             </div>
        )}

        {/* 4. Низ-Право: ОСТАТОК МЕСТ */}
        <div className="absolute bottom-8 right-5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${event.spotsLeft > 5 ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-white uppercase">
                {event.spotsLeft} {t.event.spots}
            </span>
        </div>

        {/* ✂️ ЗИГЗАГ (Белая геометрическая фигура снизу) */}
        <div 
            className="absolute -bottom-1 left-0 right-0 h-8 bg-white z-0" 
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 75% 100%, 25% 100%, 0 0)' }}
        ></div>
      </div>

      {/* ================= КОНТЕНТ (ИНФО) ================= */}
      <div className="px-6 pb-6 pt-1 flex flex-col flex-grow relative bg-white">
        
        {/* Локация */}
        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold uppercase tracking-wide mb-1.5">
            <MapPin size={14} className="text-teal-500"/>
            <span className="truncate">{event.location}</span>
        </div>

        {/* Заголовок (Жирный, Compact) */}
        <h3 className="text-xl font-black text-gray-800 uppercase leading-6 mb-2 group-hover:text-teal-600 transition-colors">
            {event.title}
        </h3>

        {/* Подзаголовок (2-3 строки) */}
        <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
            {event.subtitle || event.description || 'Описание уточняется...'}
        </p>
        
        {/* Разделитель и Футер */}
        <div className="mt-auto border-t border-gray-100 pt-4 flex items-end justify-between">
            
            {/* Лево: Инфо и Цена */}
            <div>
                {/* Длительность / Сложность */}
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mb-1.5">
                   <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-gray-500"><Clock size={12}/> {event.duration || '1 день'}</span>
                </div>
                
                {/* Цена */}
                <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">от</span>
                    <span className="text-2xl font-black text-teal-700 leading-none">{event.price.adult}₽</span>
                    {/* Старая цена (зачеркнутая) */}
                    {event.priceOld && (
                        <span className="text-sm text-gray-300 line-through font-bold decoration-red-300 decoration-2">
                            {event.priceOld}₽
                        </span>
                    )}
                </div>
            </div>

            {/* Право: Кнопка-стрелка */}
            <button 
                onClick={() => onSelect(event)}
                className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200 hover:bg-teal-700 hover:scale-110 transition-all active:scale-95 group-hover:shadow-xl"
            >
                <ArrowRight size={22} strokeWidth={2.5} />
            </button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
