import React, { useState } from 'react';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

// Локальные константы типов для стилизации
const EventTypes = { RAFTING: 'rafting', HIKING: 'hiking', CYCLING: 'cycling' };

const EventCard = ({ event, onSelect, index, t }) => {
  const [hover, setHover] = useState(false);
  
  const typeLabels = { 
      [EventTypes.RAFTING]: t.filters.rafting, 
      [EventTypes.HIKING]: t.filters.hiking, 
      [EventTypes.CYCLING]: t.filters.cycling 
  };
  
  const typeColors = { 
      [EventTypes.RAFTING]: 'from-blue-500 to-cyan-500', 
      [EventTypes.HIKING]: 'from-green-500 to-emerald-500', 
      [EventTypes.CYCLING]: 'from-orange-500 to-red-500' 
  };
  
  const defaultType = EventTypes.HIKING;
  const pct = ((event.spotsLeft / (event.spots || 20)) * 100).toFixed(0);
  
  return (
    <article 
        className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group animate-fadeInUp" 
        style={{ animationDelay: `${index * 100}ms` }} 
        onMouseEnter={() => setHover(true)} 
        onMouseLeave={() => setHover(false)}
    >
      <div className="relative h-56 overflow-hidden bg-gray-200">
        <img 
            src={event.image} 
            alt={event.title} 
            className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className={`absolute top-4 left-4 bg-gradient-to-r ${typeColors[event.type || defaultType]} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
            {typeLabels[event.type] || t.filters.hiking}
        </div>
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${pct > 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-bold text-gray-800">{event.spotsLeft} {t.event.spotsLeft}</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-1">{event.title}</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 text-gray-600">
              <Calendar size={18} className="text-teal-500" />
              <span className="text-sm font-medium">{new Date(event.date).toLocaleDateString()} {event.time && `в ${event.time.slice(0,5)}`}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
              <MapPin size={18} className="text-teal-500" />
              <span className="text-sm truncate">{event.location}</span>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{event.price.adult}₽</div>
        </div>
        <button 
            onClick={() => onSelect(event)} 
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />{t.event.register}
        </button>
      </div>
    </article>
  );
};

export default EventCard;
