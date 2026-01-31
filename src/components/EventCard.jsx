import React from 'react';
import { MapPin, Calendar, Zap, Ticket, Users, ArrowRight } from 'lucide-react';

// Цвета для маркетинговых меток
const marketingColors = {
  'эксклюзив': 'bg-[#D946EF] text-white',
  'новинка': 'bg-emerald-500 text-white',
  'топ': 'bg-red-500 text-white',
  'хит': 'bg-orange-500 text-white',
  'для новичков': 'bg-cyan-500 text-white',
  'default': 'bg-slate-800 text-white'
};

const EventCard = ({ event, onSelect, t }) => {
  const { title, subtitle, date, end_date, price, priceOld, image, spotsLeft, type, location, label } = event;

  // 1. Логика цвета метки
  const labelColor = marketingColors[label?.toLowerCase()] || marketingColors.default;

  // 2. Логика форматирования даты (Полный период)
  const formatDateRange = (start, end) => {
    const d1 = new Date(start);
    const d1Day = d1.getDate();
    const d1Month = d1.toLocaleString('ru-RU', { month: 'short' }).replace('.', '');

    if (!end) return `${d1Day} ${d1Month}`;

    const d2 = new Date(end);
    const d2Day = d2.getDate();
    const d2Month = d2.toLocaleString('ru-RU', { month: 'short' }).replace('.', '');

    // Если месяцы совпадают: "06-08 мар"
    if (d1Month === d2Month) {
        return `${d1Day}-${d2Day} ${d1Month}`;
    }
    // Если разные: "28 фев - 02 мар"
    return `${d1Day} ${d1Month} - ${d2Day} ${d2Month}`;
  };

  const dateString = formatDateRange(date, end_date);

  // 3. Проверка наличия детских/семейных билетов
  const hasChildTicket = price?.child > 0;
  const hasFamilyTicket = price?.family > 0;

  return (
    <div
      onClick={() => onSelect(event)}
      className="group flex flex-col h-full bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer select-none"
    >
      {/* ================= ФОТО ================= */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Градиент */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* ВЕРХ СЛЕВА: Вид тура */}
        <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest rounded-full text-slate-800 shadow-sm">
                {t?.filters?.[type] || type}
            </span>
        </div>

        {/* ВЕРХ СПРАВА: Маркетинговая метка */}
        {label && (
            <div className="absolute top-4 right-4">
                <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md ${labelColor}`}>
                    {label}
                </span>
            </div>
        )}

        {/* НИЗ СПРАВА: Плашка "Последние места" (если < 3) */}
        {spotsLeft !== null && spotsLeft < 3 && spotsLeft > 0 && (
            <div className="absolute bottom-4 right-4">
                 <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-rose-600/40 animate-pulse border-2 border-white/20">
                    <Zap size={12} fill="currentColor" />
                    Последние места
                </span>
            </div>
        )}
      </div>

      {/* ================= КОНТЕНТ ================= */}
      <div className="flex flex-col flex-grow p-6 relative">
        
        {/* 1. Локация и Дата */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            {location && (
                <div className="flex items-center gap-1.5 text-teal-700">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{location}</span>
                </div>
            )}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5" />
                <span>{dateString}</span>
            </div>
        </div>

        {/* 2. Название */}
        <h3 className="text-2xl font-condensed font-bold text-slate-900 uppercase leading-none mb-2 group-hover:text-teal-600 transition-colors">
            {title}
        </h3>

        {/* 3. Краткое описание */}
        <p className="text-sm text-slate-500 font-medium leading-snug line-clamp-2 mb-4">
            {subtitle || "Описание скоро появится..."}
        </p>

        {/* 4. Плашки билетов (Детский / Семейный) */}
        {(hasChildTicket || hasFamilyTicket) && (
            <div className="flex flex-wrap gap-2 mb-4">
                {hasChildTicket && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold uppercase tracking-wide border border-yellow-100">
                        <Ticket size={12} /> Детские билеты
                    </span>
                )}
                {hasFamilyTicket && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-100">
                        <Users size={12} /> Семейный билет
                    </span>
                )}
            </div>
        )}

        {/* 5. Цены (Низ карточки) */}
        <div className="mt-auto border-t border-slate-100 pt-4">
            <div className="flex items-end justify-between">
                <div>
                     {/* Цена "ОТ" */}
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400 font-bold uppercase">от</span>
                        <span className="text-2xl font-condensed font-bold text-slate-900 leading-none">
                            {price?.adult} <span className="text-base font-normal text-slate-500">р.</span>
                        </span>
                    </div>
                    
                    {/* Старая цена (зачеркнутая ниже) */}
                    {priceOld && (
                        <div className="text-xs text-slate-400 line-through font-medium mt-0.5 ml-4">
                            {priceOld} р.
                        </div>
                    )}
                </div>
                
                {/* Кнопка стрелка (декоративная) */}
                <button className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default EventCard;
