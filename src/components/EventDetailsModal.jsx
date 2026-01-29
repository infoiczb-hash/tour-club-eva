import React from 'react';
import { X, Calendar, Clock, MapPin, User, Mountain, Map, CheckCircle, Sparkles } from 'lucide-react';

const EventDetailsModal = ({ event, onClose, onRegister, t }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
        
        {/* Кнопка закрытия */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition backdrop-blur">
            <X size={20} />
        </button>

        {/* Обложка */}
        <div className="relative h-64 shrink-0">
            <img src={event.image || 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d'} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-6 text-white">
                <div className="inline-block px-3 py-1 bg-teal-600 rounded-full text-xs font-bold mb-2 uppercase tracking-wide">
                    {t.filters[event.type] || event.type}
                </div>
                <h2 className="text-3xl font-bold leading-tight shadow-black drop-shadow-lg">{event.title}</h2>
            </div>
        </div>

        {/* Контент (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Основные метрики */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">Дата</span>
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <Calendar size={16} className="text-teal-500"/>
                        {new Date(event.date).toLocaleDateString()}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">Время</span>
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <Clock size={16} className="text-teal-500"/>
                        {event.time?.slice(0,5)}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">Сложность</span>
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <Mountain size={16} className="text-teal-500"/>
                        {event.difficulty || 'Средняя'}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">Гид</span>
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <User size={16} className="text-teal-500"/>
                        {event.guide || 'Команда'}
                    </div>
                </div>
            </div>

            {/* Описание */}
            {event.description && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">О приключении</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
                </div>
            )}

            {/* Маршрут */}
            {event.route && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><Map size={16}/> Маршрут</h3>
                    <p className="text-sm text-blue-700">{event.route}</p>
                </div>
            )}

            {/* Что включено */}
            {event.included && event.included.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Включено в стоимость</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {event.included.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle size={16} className="text-green-500 shrink-0"/> {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* Футер с кнопкой */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <div>
                <p className="text-xs text-gray-500 font-medium">Стоимость участия</p>
                <p className="text-2xl font-bold text-teal-700">{event.price.adult}₽</p>
            </div>
            <button 
                onClick={onRegister}
                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg hover:shadow-teal-200/50 flex items-center gap-2"
            >
                <Sparkles size={18} /> {t.event.registerBtn}
            </button>
        </div>

      </div>
    </div>
  );
};

export default EventDetailsModal;
