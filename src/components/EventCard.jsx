import React, { useState } from 'react';
import { Calendar, MapPin, Sparkles, User } from 'lucide-react';
import Button from './ui/Button'; // ✅ Импортируем умную кнопку

const EventCard = ({ event, onSelect, index, t }) => {
  const [hover, setHover] = useState(false);
  
  const diffColors = { 
      'легкая': 'bg-green-100 text-green-800 border-green-300', 
      'средняя': 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      'сложная': 'bg-red-100 text-red-800 border-red-300' 
  };

  const typeColors = { 
      'water': 'from-blue-500 to-cyan-500', 
      'hiking_1': 'from-green-500 to-emerald-500', 
      'weekend': 'from-orange-500 to-red-500',
      'kids': 'from-yellow-400 to-orange-500',
      'expedition': 'from-indigo-600 to-purple-600',
      'hiking': 'from-green-500 to-emerald-500',
      'rafting': 'from-blue-500 to-cyan-500'
  };

  const spotsTotal = event.spots || 20;
  const pct = ((event.spotsLeft / spotsTotal) * 100).toFixed(0);
  
  return (
    <article 
        className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group animate-fadeInUp flex flex-col h-full" 
        style={{ animationDelay: `${index * 100}ms` }} 
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
    >
      <div className="relative h-56 overflow-hidden shrink-0">
        <img 
            src={event.image || 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d'} 
            alt={event.title} 
            className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        <div className={`absolute top-4 left-4 bg-gradient-to-r ${typeColors[event.type] || typeColors.hiking} text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider transform transition-transform ${hover ? 'scale-105' : 'scale-100'}`}>
            {t.filters[event.type] || event.type}
        </div>

        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-xs font-bold text-gray-800">{event.spotsLeft} {t.event.spots}</span>
          </div>
        </div>

        {event.spotsLeft <= 5 && event.spotsLeft > 0 && (
            <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-lg">
                🔥 Осталось мало мест!
            </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-1">
            {event.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 text-gray-600">
              <Calendar size={18} className="text-teal-500 shrink-0" />
              <span className="text-sm font-medium">
                  {new Date(event.date).toLocaleDateString()} 
                  <span className="text-gray-400 ml-1">в {event.time?.slice(0,5)}</span>
              </span>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
              <MapPin size={18} className="text-teal-500 shrink-0" />
              <span className="text-sm truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
              <User size={18} className="text-teal-500 shrink-0" />
              <span className="text-sm truncate">{event.guide || 'Команда клуба'}</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 mt-auto">
             <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${diffColors[event.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                {(event.difficulty || 'Средняя').toUpperCase()}
             </span>
             <div className="text-right">
                <div className="text-[10px] text-gray-400 font-medium">цена за взрослого</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                    {event.price.adult}₽
                </div>
             </div>
        </div>

        <div className="mb-5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
             <div 
                className={`h-full transition-all duration-1000 ${pct > 50 ? 'bg-gradient-to-r from-green-400 to-green-600' : pct > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} 
                style={{ width: `${pct}%` }}
             ></div>
        </div>

        {/* Используем Button из UI */}
        <Button onClick={() => onSelect(event)} className="w-full">
            <Sparkles size={18} />
            {t.event.registerBtn}
        </Button>
      </div>
    </article>
  );
};

export default EventCard;
