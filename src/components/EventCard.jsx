import React from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, Zap } from 'lucide-react';

// Настройка цветов для сложности
const difficultyConfig = {
  easy: { color: 'bg-green-500', label: 'Легкий' },
  medium: { color: 'bg-yellow-500', label: 'Средний' },
  hard: { color: 'bg-orange-500', label: 'Сложный' },
  expert: { color: 'bg-red-600', label: 'Экстремальный' },
  // Значение по умолчанию
  default: { color: 'bg-slate-500', label: 'Обычный' }
};

const EventCard = ({ event, onSelect, t }) => {
  // Деструктуризация данных события
  const { title, date, price, image, spotsLeft, difficulty, type, duration, location } = event;
  
  // Определяем настройки сложности
  const diff = difficultyConfig[difficulty] || difficultyConfig.default;

  // Форматируем дату (например: "6 марта")
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div
      onClick={() => onSelect(event)}
      className="group relative flex flex-col h-full bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer select-none"
    >
      {/* 1. БЛОК С ФОТО (Эффекты) */}
      <div className="relative h-72 overflow-hidden">
        {/* Картинка с зумом при наведении */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Градиент снизу для читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* ТЕГ: Категория (Слева сверху) */}
        <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest rounded-full text-slate-800 shadow-sm border border-white/20">
                {t?.filters?.[type] || type}
            </span>
        </div>

        {/* ТЕГ: Горящие места (Справа сверху) */}
        {spotsLeft <= 5 && (
            <div className="absolute top-4 right-4">
                <span className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-rose-500/20 animate-pulse">
                    <Zap className="w-3 h-3 fill-current" />
                    Осталось {spotsLeft}
                </span>
            </div>
        )}

        {/* ТЕГ: Сложность (Снизу слева) */}
        <div className="absolute bottom-4 left-4">
             <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md bg-black/40 border border-white/10`}>
                <span className={`w-2 h-2 rounded-full ${diff.color}`} />
                {diff.label}
             </span>
        </div>
      </div>

      {/* 2. КОНТЕНТ (Чистый дизайн) */}
      <div className="flex flex-col flex-grow p-7 relative">
        
        {/* Инфо: Дата и Локация */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                {dateStr}
            </div>
            {location && (
                <div className="flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {location}
                </div>
            )}
        </div>

        {/* Заголовок */}
        <h3 className="text-2xl font-condensed font-bold text-slate-900 uppercase leading-none mb-2 group-hover:text-teal-600 transition-colors">
            {title}
        </h3>
        
        {/* Длительность (если есть) */}
        {duration && (
            <p className="text-sm text-slate-500 font-medium mb-6">
                Длительность: {duration}
            </p>
        )}

        {/* НИЗ: Цена и Кнопка */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Стоимость</span>
                <span className="text-xl md:text-2xl font-condensed font-bold text-slate-900">
                    {price.adult} <span className="text-sm text-slate-400 font-normal">MDL</span>
                </span>
            </div>

            {/* Активная кнопка со стрелкой */}
            <button className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-teal-600 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-teal-600/30 group-hover:-rotate-45">
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
