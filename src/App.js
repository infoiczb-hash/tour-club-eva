import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Calendar, MapPin, Clock, Filter, X, Grid, CalendarDays, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Award, Globe, Wifi, WifiOff, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ============ CONSTANTS ============
const EventTypes = { RAFTING: 'rafting', HIKING: 'hiking', CYCLING: 'cycling' };
const ViewModes = { GRID: 'grid', CALENDAR: 'calendar' };
const Languages = { RU: 'ru', EN: 'en', RO: 'ro' };

// ============ TRANSLATIONS (i18n) ============
const translations = {
  ru: {
    header: { title: 'Турклуб "Эва"', subtitle: 'Приключения каждые выходные 🌄' },
    stats: { events: 'Мероприятий', spots: 'Свободных мест', activities: 'Активностей' },
    filters: { all: 'Все', rafting: 'Сплавы', hiking: 'Походы', cycling: 'Велотуры' },
    event: { register: 'Записаться', spotsLeft: 'мест', lastSpots: '🔥 Последние места!', included: 'Что включено:', route: 'Маршрут:' },
    form: { name: 'Ваше имя *', phone: 'Телефон *', email: 'Email', ticketType: 'Тип билета', quantity: 'Количество', total: 'Итого:', submit: 'Зарегистрироваться', adult: 'Взрослый', child: 'Детский', family: 'Семейный' },
    validation: { nameRequired: 'Укажите имя', phoneRequired: 'Укажите телефон', invalidPhone: 'Некорректный формат', invalidEmail: 'Некорректный email' },
    messages: { success: 'Спасибо за регистрацию! ✓', error: 'Ошибка регистрации ✗', loading: 'Загрузка...', offline: 'Нет подключения', online: 'Подключение восстановлено' },
    pwa: { install: 'Установить', installed: '✓ Установлено' },
    views: { grid: 'Сетка', calendar: 'Календарь' }
  },
  en: {
    header: { title: 'Tour Club "Eva"', subtitle: 'Adventures every weekend 🌄' },
    stats: { events: 'Events', spots: 'Spots', activities: 'Activities' },
    filters: { all: 'All', rafting: 'Rafting', hiking: 'Hiking', cycling: 'Cycling' },
    event: { register: 'Register', spotsLeft: 'spots', lastSpots: '🔥 Last spots!', included: "What's included:", route: 'Route:' },
    form: { name: 'Your name *', phone: 'Phone *', email: 'Email', ticketType: 'Ticket type', quantity: 'Quantity', total: 'Total:', submit: 'Register', adult: 'Adult', child: 'Child', family: 'Family' },
    validation: { nameRequired: 'Enter name', phoneRequired: 'Enter phone', invalidPhone: 'Invalid format', invalidEmail: 'Invalid email' },
    messages: { success: 'Registration successful! ✓', error: 'Registration error ✗', loading: 'Loading...', offline: 'No connection', online: 'Connection restored' },
    pwa: { install: 'Install', installed: '✓ Installed' },
    views: { grid: 'Grid', calendar: 'Calendar' }
  },
  ro: {
    header: { title: 'Club turistic "Eva"', subtitle: 'Aventuri în fiecare weekend 🌄' },
    stats: { events: 'Evenimente', spots: 'Locuri', activities: 'Activități' },
    filters: { all: 'Toate', rafting: 'Rafting', hiking: 'Drumeții', cycling: 'Ciclism' },
    event: { register: 'Înscrie-te', spotsLeft: 'locuri', lastSpots: '🔥 Ultimele!', included: 'Inclus:', route: 'Rută:' },
    form: { name: 'Nume *', phone: 'Telefon *', email: 'Email', ticketType: 'Tip bilet', quantity: 'Cantitate', total: 'Total:', submit: 'Înregistrare', adult: 'Adult', child: 'Copil', family: 'Familie' },
    validation: { nameRequired: 'Introdu nume', phoneRequired: 'Introdu telefon', invalidPhone: 'Format invalid', invalidEmail: 'Email invalid' },
    messages: { success: 'Înregistrare reușită! ✓', error: 'Eroare ✗', loading: 'Se încarcă...', offline: 'Fără conexiune', online: 'Conexiune OK' },
    pwa: { install: 'Instalează', installed: '✓ Instalat' },
    views: { grid: 'Grilă', calendar: 'Calendar' }
  }
};

// ============ API SIMULATION ============
const EventsAPI = {
  async getEvents() {
    await new Promise(r => setTimeout(r, 1200));
    return [
      { id: 1, title: 'Сплав Тирасполь - Слободзея', type: EventTypes.RAFTING, date: '2026-01-25', time: '10:30', location: 'Тираспольский пляж', duration: '7 часов', distance: '24 км', difficulty: 'средняя', spots: 25, spotsLeft: 12, image: 'https://images.unsplash.com/photo-1503870243202-7c0a01cfe1cc?w=600', price: { adult: 340, child: 300, family: 625 }, description: 'Самый пляжный маршрут по Днестру!', included: ['Трансфер', 'Байдарка', 'Инструктаж', 'Чай', 'Гид'], route: 'Тирасполь → Молдованка → Слободзея' },
      { id: 2, title: 'Поход в Старый Орхей', type: EventTypes.HIKING, date: '2026-01-26', time: '08:00', location: 'Центральный рынок', duration: '8 часов', distance: '12 км', difficulty: 'легкая', spots: 20, spotsLeft: 8, image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600', price: { adult: 250, child: 200, family: 400 }, description: 'Пещерный монастырь и археология.', included: ['Трансфер', 'Билеты', 'Экскурсия', 'Обед'], route: 'Тирасполь → Старый Орхей' },
      { id: 3, title: 'Велотур по Приднестровью', type: EventTypes.CYCLING, date: '2026-02-01', time: '09:00', location: 'Парк Победы', duration: '6 часов', distance: '35 км', difficulty: 'средняя', spots: 15, spotsLeft: 15, image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600', price: { adult: 280, child: 220, family: 450 }, description: 'Живописные места Приднестровья.', included: ['Велосипед', 'Шлем', 'Перекус', 'Инструктор'], route: 'Тирасполь → Бендеры → Варница' },
      { id: 4, title: 'Сплав (2 дня)', type: EventTypes.RAFTING, date: '2026-02-07', time: '10:00', location: 'Бендеры', duration: '2 дня', distance: '40 км', difficulty: 'средняя', spots: 20, spotsLeft: 3, image: 'https://images.unsplash.com/photo-1464547323744-4edd0cd0c746?w=600', price: { adult: 650, child: 550, family: 1100 }, description: 'Ночевка в лесу, костер!', included: ['Трансфер', 'Байдарки', 'Палатки', 'Питание', 'Гид'], route: 'Бендеры → ночевка → Карагаш' },
      { id: 5, title: 'Треккинг к водопаду', type: EventTypes.HIKING, date: '2026-02-08', time: '07:30', location: 'ЖД вокзал', duration: '10 часов', distance: '18 км', difficulty: 'сложная', spots: 12, spotsLeft: 3, image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600', price: { adult: 400, child: 320, family: 650 }, description: 'Горный маршрут для опытных.', included: ['Трансфер', 'Палки', 'Обед', 'Страховка'], route: 'Тропа → водопад' }
    ];
  },
  async registerForEvent() {
    await new Promise(r => setTimeout(r, 1500));
    return Math.random() > 0.15;
  }
};

// ============ VALIDATION ============
const ValidationUtils = {
  validateForm(data, max) {
    const e = {};
    if (!data.name.trim()) e.name = 'nameRequired';
    if (!data.phone.trim()) e.phone = 'phoneRequired';
    else if (!/^\+?[\d\s\-()]{7,}$/.test(data.phone)) e.phone = 'invalidPhone';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'invalidEmail';
    if (data.tickets < 1 || data.tickets > max) e.tickets = `Доступно 1-${max}`;
    return e;
  }
};

// ============ REDUCER ============
const formReducer = (s, a) => a.type === 'SET_FIELD' ? { ...s, [a.field]: a.value } : a.type === 'RESET' ? a.payload : s;

// ============ COMPONENTS ============
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-slideIn ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
    {type === 'success' && <CheckCircle size={24} />}
    {type === 'error' && <AlertCircle size={24} />}
    {type === 'info' && <Loader size={24} className="animate-spin" />}
    <span className="font-semibold">{message}</span>
    <button onClick={onClose} className="ml-4 hover:opacity-80"><X size={20} /></button>
  </div>
);

const LanguageSwitcher = ({ currentLang, onChange }) => (
  <div className="flex gap-2 bg-white/20 backdrop-blur rounded-xl p-1">
    {Object.values(Languages).map(lang => (
      <button key={lang} onClick={() => onChange(lang)} className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${currentLang === lang ? 'bg-white text-teal-600 shadow-lg scale-110' : 'text-white hover:bg-white/10'}`}>
        {lang.toUpperCase()}
      </button>
    ))}
  </div>
);

const PWAButton = ({ t }) => {
  const [state, setState] = useState('ready');
  const handle = () => { setState('installing'); setTimeout(() => setState('installed'), 800); setTimeout(() => setState('hidden'), 3500); };
  if (state === 'hidden') return null;
  return (
    <button onClick={handle} disabled={state === 'installing'} className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all disabled:opacity-50">
      {state === 'installed' ? <CheckCircle size={20} /> : state === 'installing' ? <Loader size={20} className="animate-spin" /> : <Download size={20} />}
      <span className="text-sm font-bold">{state === 'installed' ? t.pwa.installed : t.pwa.install}</span>
    </button>
  );
};

const NetworkStatus = ({ isOnline, t }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); const tm = setTimeout(() => setShow(false), 3000); return () => clearTimeout(tm); }, [isOnline]);
  if (!show) return null;
  return (
    <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-slideIn ${isOnline ? 'bg-green-500' : 'bg-red-500'} text-white`}>
      {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
      <span className="font-semibold">{isOnline ? t.messages.online : t.messages.offline}</span>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}><Icon size={24} className="text-white" /></div>
      <div><p className="text-gray-600 text-sm">{label}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
    </div>
  </div>
);

const EventCard = ({ event, onSelect, index, t }) => {
  const [hover, setHover] = useState(false);
  const diffColors = { 'легкая': 'bg-green-100 text-green-800 border-green-300', 'средняя': 'bg-yellow-100 text-yellow-800 border-yellow-300', 'сложная': 'bg-red-100 text-red-800 border-red-300' };
  const typeLabels = { [EventTypes.RAFTING]: t.filters.rafting, [EventTypes.HIKING]: t.filters.hiking, [EventTypes.CYCLING]: t.filters.cycling };
  const typeColors = { [EventTypes.RAFTING]: 'from-blue-500 to-cyan-500', [EventTypes.HIKING]: 'from-green-500 to-emerald-500', [EventTypes.CYCLING]: 'from-orange-500 to-red-500' };
  const pct = ((event.spotsLeft / event.spots) * 100).toFixed(0);
  
  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative h-56 overflow-hidden">
        <img src={event.image} alt={event.title} className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className={`absolute top-4 left-4 bg-gradient-to-r ${typeColors[event.type]} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform transition-transform ${hover ? 'scale-110' : 'scale-100'}`}>{typeLabels[event.type]}</div>
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-bold text-gray-800">{event.spotsLeft} {t.event.spotsLeft}</span>
          </div>
        </div>
        {event.spotsLeft <= 5 && <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce">{t.event.lastSpots}</div>}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-1">{event.title}</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 text-gray-600"><Calendar size={18} className="text-teal-500" /><span className="text-sm font-medium">{new Date(event.date).toLocaleDateString('ru')} в {event.time}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><MapPin size={18} className="text-teal-500" /><span className="text-sm truncate">{event.location}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><Clock size={18} className="text-teal-500" /><span className="text-sm">{event.duration} • {event.distance}</span></div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${diffColors[event.difficulty]}`}>{event.difficulty}</span>
          <div className="text-right">
            <div className="text-sm text-gray-500">от</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{event.price.adult}₽</div>
          </div>
        </div>
        <div className="mb-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${pct > 50 ? 'bg-gradient-to-r from-green-400 to-green-600' : pct > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} style={{ width: `${pct}%` }}></div>
        </div>
        <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">{event.description}</p>
        <button onClick={() => onSelect(event)} className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          <Sparkles size={18} />{t.event.register}
        </button>
      </div>
    </article>
  );
};

const CalendarView = ({ events, onSelectEvent, t }) => {
  const [date, setDate] = useState(new Date());
  const y = date.getFullYear(), m = date.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  
  const eventsByDate = useMemo(() => {
    const g = {};
    events.forEach(e => {
      const d = new Date(e.date);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!g[k]) g[k] = [];
      g[k].push(e);
    });
    return g;
  }, [events]);
  
  const getEvents = day => eventsByDate[`${y}-${m}-${day}`] || [];
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`e${i}`} className="p-2 bg-gray-50/50"></div>);
  for (let d = 1; d <= daysInMonth; d++) {
    const today = new Date().getDate() === d && new Date().getMonth() === m && new Date().getFullYear() === y;
    const evs = getEvents(d);
    days.push(
      <div key={d} className={`min-h-28 p-3 border border-gray-200 transition-all duration-300 ${today ? 'bg-gradient-to-br from-teal-50 to-blue-50 border-teal-300 shadow-inner' : 'bg-white hover:bg-gray-50'}`}>
        <div className={`text-sm font-bold mb-2 flex justify-between items-center ${today ? 'text-teal-600' : 'text-gray-700'}`}>
          <span>{d}</span>
          {today && <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">Сегодня</span>}
        </div>
        <div className="space-y-1.5">
          {evs.map(e => (
            <button key={e.id} onClick={() => onSelectEvent(e)} className="w-full text-left text-xs p-2 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 transition-all shadow hover:shadow-md transform hover:scale-105">
              <div className="font-bold truncate">{e.time}</div>
              <div className="truncate opacity-90">{e.title}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setDate(new Date(y, m - 1))} className="p-3 hover:bg-teal-50 rounded-xl transition-all hover:scale-110 active:scale-95"><ChevronLeft size={28} className="text-teal-600" /></button>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{months[m]} {y}</h2>
        <button onClick={() => setDate(new Date(y, m + 1))} className="p-3 hover:bg-teal-50 rounded-xl transition-all hover:scale-110 active:scale-95"><ChevronRight size={28} className="text-teal-600" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0 border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner">
        {dayNames.map(n => <div key={n} className="p-4 bg-gradient-to-r from-teal-600 to-blue-600 text-center font-bold text-white">{n}</div>)}
        {days}
      </div>
    </div>
  );
};

const RegistrationForm = ({ event, formData, dispatch, onSubmit, errors, t, submitting }) => (
  <form onSubmit={onSubmit} className="space-y-5" noValidate>
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{t.form.name}</label>
      <input value={formData.name} onChange={e => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })} className={`w-full px-4 py-3 border-2 ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all`} disabled={submitting} />
      {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{t.validation[errors.name] || errors.name}</p>}
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{t.form.phone}</label>
      <input value={formData.phone} onChange={e => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })} placeholder="+373" className={`w-full px-4 py-3 border-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all`} disabled={submitting} />
      {errors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{t.validation[errors.phone] || errors.phone}</p>}
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{t.form.email}</label>
      <input type="email" value={formData.email} onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })} className={`w-full px-4 py-3 border-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all`} disabled={submitting} />
      {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{t.validation[errors.email]}</p>}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t.form.ticketType}</label>
        <select value={formData.ticketType} onChange={e => dispatch({ type: 'SET_FIELD', field: 'ticketType', value: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all" disabled={submitting}>
          <option value="adult">{t.form.adult} ({event.price.adult}₽)</option>
          <option value="child">{t.form.child} ({event.price.child}₽)</option>
          <option value="family">{t.form.family} ({event.price.family}₽)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t.form.quantity}</label>
        <input type="number" min="1" max={event.spotsLeft} value={formData.tickets} onChange={e => dispatch({ type: 'SET_FIELD', field: 'tickets', value: parseInt(e.target.value) || 1 })} className={`w-full px-4 py-3 border-2 ${errors.tickets ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 transition-all`} disabled={submitting} />
        {errors.tickets && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.tickets}</p>}
      </div>
    </div>
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border-2 border-teal-200">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-gray-700">{t.form.total}</span>
        <span className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{event.price[formData.ticketType] * formData.tickets}₽</span>
      </div>
    </div>
    <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
      {submitting ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
      {t.form.submit}
    </button>
  </form>
);

const EventModal = ({ event, onClose, onSubmit, t }) => {
  const init = { name: '', email: '', phone: '', tickets: 1, ticketType: 'adult' };
  const [formData, dispatch] = useReducer(formReducer, init);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = ValidationUtils.validateForm(formData, event.spotsLeft);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitting(true);
      const success = await EventsAPI.registerForEvent({ ...formData, eventId: event.id });
      setSubmitting(false);
      if (success) {
        onSubmit(formData);
        dispatch({ type: 'RESET', payload: init });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="relative rounded-xl overflow-hidden mb-6 shadow-lg">
            <img src={event.image} alt={event.title} className="w-full h-72 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-5 mb-6 border-2 border-teal-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Award className="text-teal-600" size={20} />
              {t.event.included}
            </h3>
            <ul className="space-y-2">
              {event.included.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-6 bg-white rounded-xl p-5 border-2 border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="text-teal-600" size={20} />
              {t.event.route}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{event.route}</p>
          </div>
          <RegistrationForm event={event} formData={formData} dispatch={dispatch} onSubmit={handleSubmit} errors={errors} t={t} submitting={submitting} />
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({ filterType, setFilterType, showFilters, t }) => {
  const filters = [
    { value: 'all', label: t.filters.all },
    { value: EventTypes.RAFTING, label: t.filters.rafting },
    { value: EventTypes.HIKING, label: t.filters.hiking },
    { value: EventTypes.CYCLING, label: t.filters.cycling }
  ];

  if (!showFilters) return null;

  return (
    <div className="flex flex-wrap gap-3 animate-fadeIn">
      {filters.map((filter, idx) => (
        <button key={filter.value} onClick={() => setFilterType(filter.value)} className={`px-5 py-2.5 rounded-xl transition-all font-bold transform hover:scale-105 active:scale-95 ${filterType === filter.value ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`} style={{ animationDelay: `${idx * 50}ms` }}>
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// ============ MAIN APP ============
const TourClubWebsite = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(ViewModes.GRID);
  const [language, setLanguage] = useState(Languages.RU);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState(null);

  const t = translations[language];

  useEffect(() => {
    loadEvents();
    const onlineTimer = setInterval(() => setIsOnline(Math.random() > 0.05), 15000);
    return () => clearInterval(onlineTimer);
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setToast({ message: t.messages.loading, type: 'info' });
    try {
      const data = await EventsAPI.getEvents();
      setEvents(data);
      setToast(null);
    } catch {
      setToast({ message: t.messages.error, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [filterType, events]);

  const stats = useMemo(() => ({
    totalEvents: events.length,
    totalSpots: events.reduce((sum, e) => sum + e.spotsLeft, 0),
    activeTypes: new Set(events.map(e => e.type)).size
  }), [events]);

  const openModal = useCallback(event => {
    setSelectedEvent(event);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedEvent(null);
  }, []);

  const handleSubmit = useCallback(formData => {
    setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, spotsLeft: e.spotsLeft - formData.tickets } : e));
    setToast({ message: t.messages.success, type: 'success' });
    setTimeout(() => setToast(null), 4000);
    closeModal();
  }, [selectedEvent, closeModal, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <header className="relative bg-gradient-to-r from-teal-600 via-blue-600 to-cyan-600 text-white shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="animate-fadeInLeft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Sparkles size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-black mb-1 tracking-tight">{t.header.title}</h1>
                  <p className="text-xl opacity-90 font-medium">{t.header.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 animate-fadeInRight">
              <div className="flex gap-3">
                <LanguageSwitcher currentLang={language} onChange={setLanguage} />
                <PWAButton t={t} />
              </div>
              <div className="text-right bg-white/10 backdrop-blur rounded-2xl px-6 py-4">
                <p className="text-2xl font-bold mb-1">+373 777 70141</p>
                <p className="text-sm opacity-90">Viber, Telegram</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 -mt-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard icon={Calendar} label={t.stats.events} value={stats.totalEvents} color="bg-gradient-to-r from-teal-500 to-teal-600" delay={0} />
          <StatsCard icon={TrendingUp} label={t.stats.spots} value={stats.totalSpots} color="bg-gradient-to-r from-blue-500 to-blue-600" delay={100} />
          <StatsCard icon={Award} label={t.stats.activities} value={stats.activeTypes} color="bg-gradient-to-r from-cyan-500 to-cyan-600" delay={200} />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border-2 border-white">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                <CalendarDays size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-800">Афиша мероприятий</h2>
            </div>
            
            <div className="flex gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-inner">
                <button onClick={() => setViewMode(ViewModes.GRID)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-bold ${viewMode === ViewModes.GRID ? 'bg-white text-teal-700 shadow-lg scale-105' : 'text-gray-600 hover:text-gray-800'}`}>
                  <Grid size={20} />
                  <span className="hidden sm:inline">{t.views.grid}</span>
                </button>
                <button onClick={() => setViewMode(ViewModes.CALENDAR)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-bold ${viewMode === ViewModes.CALENDAR ? 'bg-white text-teal-700 shadow-lg scale-105' : 'text-gray-600 hover:text-gray-800'}`}>
                  <CalendarDays size={20} />
                  <span className="hidden sm:inline">{t.views.calendar}</span>
                </button>
              </div>

              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${showFilters ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white' : 'bg-white text-teal-700 hover:bg-teal-50'}`}>
                <Filter size={20} />
                <span className="hidden sm:inline">Фильтры</span>
              </button>
            </div>
          </div>
          
          <FilterPanel filterType={filterType} setFilterType={setFilterType} showFilters={showFilters} t={t} />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={48} className="animate-spin text-teal-600" />
          </div>
        ) : viewMode === ViewModes.GRID ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, idx) => (
              <EventCard key={event.id} event={event} onSelect={openModal} index={idx} t={t} />
            ))}
          </div>
        ) : (
          <CalendarView events={filteredEvents} onSelectEvent={openModal} t={t} />
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-xl font-bold">Нет мероприятий</p>
            <p className="text-gray-400 mt-2">Попробуйте изменить фильтры</p>
          </div>
        )}
      </div>

      {showModal && selectedEvent && <EventModal event={selectedEvent} onClose={closeModal} onSubmit={handleSubmit} t={t} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <NetworkStatus isOnline={isOnline} t={t} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; animation-fill-mode: both; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slideIn { animation: slideIn 0.5s ease-out; }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default TourClubWebsite;
