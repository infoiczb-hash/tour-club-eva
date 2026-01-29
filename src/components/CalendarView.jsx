import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ events, onSelect, currentLang = 'ru' }) => {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth();

  // Группировка событий по дате (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  // Названия дней и месяцев через Intl (авто-перевод)
  const monthName = new Intl.DateTimeFormat(currentLang, { month: 'long', year: 'numeric' }).format(date);
  const dayNames = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, i + 1); // Понедельник как начало
      return new Intl.DateTimeFormat(currentLang, { weekday: 'short' }).format(d);
  });

  // Расчет сетки
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); 
  // Коррекция: getDay() возвращает 0 для Вс, нам нужно, чтобы Пн=0 (или как принято в локали). 
  // Для простоты сделаем Пн=0, Вс=6 (стандарт ISO).
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const renderDays = () => {
    const cells = [];
    // Пустые ячейки до начала месяца
    for (let i = 0; i < startOffset; i++) {
        cells.push(<div key={`empty-${i}`} className="bg-gray-50/50 min-h-[80px] border-b border-r border-gray-100"></div>);
    }
    // Дни месяца
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${month}-${d}`;
        const daysEvents = eventsByDate[dateKey] || [];
        const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

        cells.push(
            <div key={d} className={`min-h-[100px] p-2 border-b border-r border-gray-100 transition hover:bg-teal-50/30 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                <div className={`text-sm font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-teal-600 text-white' : 'text-gray-700'}`}>
                    {d}
                </div>
                <div className="space-y-1">
                    {daysEvents.map(ev => (
                        <button 
                            key={ev.id} 
                            onClick={() => onSelect(ev)} 
                            className="w-full text-left text-[10px] sm:text-xs px-2 py-1 rounded bg-teal-100 text-teal-800 hover:bg-teal-200 truncate font-medium transition block"
                            title={ev.title}
                        >
                           {ev.time && <span className="opacity-75 mr-1">{ev.time.slice(0,5)}</span>}
                           {ev.title}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    return cells;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fadeIn">
      {/* Шапка календаря */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b">
        <button onClick={() => setDate(new Date(year, month - 1))} className="p-2 hover:bg-white rounded-full transition shadow-sm text-teal-700"><ChevronLeft size={20} /></button>
        <h2 className="text-xl font-bold text-gray-800 capitalize">{monthName}</h2>
        <button onClick={() => setDate(new Date(year, month + 1))} className="p-2 hover:bg-white rounded-full transition shadow-sm text-teal-700"><ChevronRight size={20} /></button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {dayNames.map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Сетка */}
      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarView;
