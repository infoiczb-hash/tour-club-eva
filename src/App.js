import React, { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Calendar, MapPin, Clock, Filter, X, Grid, CalendarDays, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Award, Settings, Plus, Edit2, Trash2, Users, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

// ============ CONSTANTS ============
const EventTypes = { RAFTING: 'rafting', HIKING: 'hiking', CYCLING: 'cycling' };
const ViewModes = { GRID: 'grid', CALENDAR: 'calendar', ADMIN: 'admin' };

const translations = {
  header: { title: 'Турклуб "Эва"', subtitle: 'Приключения каждые выходные 🌄' },
  stats: { events: 'Мероприятий', spots: 'Свободных мест', revenue: 'Регистраций' },
  filters: { all: 'Все', rafting: 'Сплавы', hiking: 'Походы', cycling: 'Велотуры' },
  event: { register: 'Записаться', spotsLeft: 'мест', lastSpots: '🔥 Последние места!', included: 'Что включено:', route: 'Маршрут:' },
  form: { name: 'Ваше имя *', phone: 'Телефон *', email: 'Email', ticketType: 'Тип билета', quantity: 'Количество', total: 'Итого:', submit: 'Зарегистрироваться', adult: 'Взрослый', child: 'Детский', family: 'Семейный' },
  admin: { title: 'Админ-панель', addEvent: 'Добавить событие', save: 'Сохранить', cancel: 'Отмена' }
};

// ============ HOOKS ============
const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true });
    
    if (error) {
      setError(error.message);
      console.error('Error loading events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  const addEvent = async (eventData) => {
    const { data, error } = await supabase.from('events').insert([eventData]);
    if (!error) await loadEvents();
    return { data, error };
  };

  const updateEvent = async (id, updates) => {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id);
    if (!error) await loadEvents();
    return { data, error };
  };

  const deleteEvent = async (id) => {
    const { data, error } = await supabase.from('events').delete().eq('id', id);
    if (!error) await loadEvents();
    return { data, error };
  };

  return { events, loading, error, addEvent, updateEvent, deleteEvent, refetch: loadEvents };
};

const useRegistrations = () => {
  const createRegistration = async (regData) => {
    const { data, error } = await supabase.from('registrations').insert([regData]);
    return { data, error };
  };

  return { createRegistration };
};

// ============ VALIDATION ============
const ValidationUtils = {
  validateForm(data, max) {
    const e = {};
    if (!data.name?.trim()) e.name = 'Укажите имя';
    if (!data.phone?.trim()) e.phone = 'Укажите телефон';
    else if (!/^\+?[\d\s\-()]{7,}$/.test(data.phone)) e.phone = 'Некорректный формат';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Некорректный email';
    if (!data.tickets || data.tickets < 1 || data.tickets > max) e.tickets = `Доступно 1-${max}`;
    return e;
  },
  validateEvent(data) {
    const e = {};
    if (!data.title?.trim()) e.title = 'Укажите название';
    if (!data.type) e.type = 'Выберите тип';
    if (!data.date) e.date = 'Укажите дату';
    if (!data.time) e.time = 'Укажите время';
    if (!data.location?.trim()) e.location = 'Укажите место';
    if (!data.price_adult || data.price_adult < 0) e.price_adult = 'Укажите цену';
    if (!data.spots || data.spots < 1) e.spots = 'Укажите количество мест';
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

const StatsCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeInUp" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}><Icon size={24} className="text-white" /></div>
      <div><p className="text-gray-600 text-sm">{label}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
    </div>
  </div>
);

const EventCard = ({ event, onSelect, onEdit, onDelete, index, isAdmin }) => {
  const [hover, setHover] = useState(false);
  const diffColors = { 'легкая': 'bg-green-100 text-green-800', 'средняя': 'bg-yellow-100 text-yellow-800', 'сложная': 'bg-red-100 text-red-800' };
  const typeColors = { rafting: 'from-blue-500 to-cyan-500', hiking: 'from-green-500 to-emerald-500', cycling: 'from-orange-500 to-red-500' };
  const pct = ((event.spots_left / event.spots) * 100).toFixed(0);
  
  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative h-56 overflow-hidden">
        <img src={event.image_url} alt={event.title} className={`w-full h-full object-cover transition-transform duration-700 ${hover ? 'scale-110' : 'scale-100'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className={`absolute top-4 left-4 bg-gradient-to-r ${typeColors[event.type]} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>{event.type}</div>
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg">
          <span className="text-sm font-bold text-gray-800">{event.spots_left} мест</span>
        </div>
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(event); }} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"><Edit2 size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Удалить событие?')) onDelete(event.id); }} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"><Trash2 size={18} /></button>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-1">{event.title}</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3 text-gray-600"><Calendar size={18} className="text-teal-500" /><span className="text-sm">{event.date} в {event.time}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><MapPin size={18} className="text-teal-500" /><span className="text-sm truncate">{event.location}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><Clock size={18} className="text-teal-500" /><span className="text-sm">{event.duration} • {event.distance}</span></div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${diffColors[event.difficulty]}`}>{event.difficulty}</span>
          <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{event.price_adult}₽</div>
        </div>
        <div className="mb-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${pct > 50 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} style={{ width: `${pct}%` }}></div>
        </div>
        {!isAdmin && (
          <button onClick={() => onSelect(event)} className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2">
            <Sparkles size={18} />Записаться
          </button>
        )}
      </div>
    </article>
  );
};

const RegistrationForm = ({ event, formData, dispatch, onSubmit, errors, submitting }) => (
  <form onSubmit={onSubmit} className="space-y-5" noValidate>
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{translations.form.name}</label>
      <input value={formData.name} onChange={e => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })} className={`w-full px-4 py-3 border-2 ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 transition`} disabled={submitting} />
      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{translations.form.phone}</label>
      <input value={formData.phone} onChange={e => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })} placeholder="+373" className={`w-full px-4 py-3 border-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 transition`} disabled={submitting} />
      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
    </div>
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{translations.form.email}</label>
      <input type="email" value={formData.email} onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })} className={`w-full px-4 py-3 border-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-teal-500 transition`} disabled={submitting} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{translations.form.ticketType}</label>
        <select value={formData.ticketType} onChange={e => dispatch({ type: 'SET_FIELD', field: 'ticketType', value: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500" disabled={submitting}>
          <option value="adult">{translations.form.adult} ({event.price_adult}₽)</option>
          <option value="child">{translations.form.child} ({event.price_child}₽)</option>
          <option value="family">{translations.form.family} ({event.price_family}₽)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{translations.form.quantity}</label>
        <input type="number" min="1" max={event.spots_left} value={formData.tickets} onChange={e => dispatch({ type: 'SET_FIELD', field: 'tickets', value: parseInt(e.target.value) || 1 })} className={`w-full px-4 py-3 border-2 ${errors.tickets ? 'border-red-500' : 'border-gray-300'} rounded-xl`} disabled={submitting} />
        {errors.tickets && <p className="text-red-500 text-xs mt-1">{errors.tickets}</p>}
      </div>
    </div>
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border-2 border-teal-200">
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-gray-700">{translations.form.total}</span>
        <span className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{event[`price_${formData.ticketType}`] * formData.tickets}₽</span>
      </div>
    </div>
    <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
      {submitting ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
      {translations.form.submit}
    </button>
  </form>
);

const EventModal = ({ event, onClose, onSubmit }) => {
  const init = { name: '', email: '', phone: '', tickets: 1, ticketType: 'adult' };
  const [formData, dispatch] = useReducer(formReducer, init);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = 'unset'; };
  }, [onClose]);

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = ValidationUtils.validateForm(formData, event.spots_left);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitting(true);
      await onSubmit(formData);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition"><X size={24} /></button>
        </div>
        <div className="p-6">
          <img src={event.image_url} alt={event.title} className="w-full h-72 object-cover rounded-xl mb-6" />
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-5 mb-6 border-2 border-teal-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Award className="text-teal-600" size={20} />{translations.event.included}</h3>
            <ul className="space-y-2">
              {event.included?.map((item, idx) => <li key={idx} className="text-sm text-gray-700 flex gap-2"><span className="text-teal-600 font-bold">✓</span><span>{item}</span></li>)}
            </ul>
          </div>
          <div className="mb-6 bg-white rounded-xl p-5 border-2 border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin className="text-teal-600" size={20} />{translations.event.route}</h3>
            <p className="text-sm text-gray-700">{event.route}</p>
          </div>
          <RegistrationForm event={event} formData={formData} dispatch={dispatch} onSubmit={handleSubmit} errors={errors} submitting={submitting} />
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ events, onAdd, onEdit, onDelete, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const init = { title: '', type: 'rafting', date: '', time: '', location: '', duration: '', distance: '', difficulty: 'средняя', spots: 10, spots_left: 10, image_url: '', price_adult: 0, price_child: 0, price_family: 0, description: '', included: [], route: '', is_active: true };
  const [formData, dispatch] = useReducer(formReducer, init);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = ValidationUtils.validateEvent(formData);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      if (editingEvent) await onEdit(editingEvent.id, formData);
      else await onAdd(formData);
      setShowForm(false);
      setEditingEvent(null);
      dispatch({ type: 'RESET', payload: init });
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    dispatch({ type: 'RESET', payload: event });
    setShowForm(true);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader size={48} className="animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">📋 Управление событиями</h2>
        <button onClick={() => { setShowForm(true); setEditingEvent(null); dispatch({ type: 'RESET', payload: init }); }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition shadow-lg">
          <Plus size={20} />Добавить событие
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-teal-200">
          <h3 className="text-xl font-bold mb-4">{editingEvent ? 'Редактировать событие' : 'Новое событие'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Название *</label>
                <input value={formData.title} onChange={e => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })} className={`w-full px-4 py-2 border-2 ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-xl`} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Тип *</label>
                <select value={formData.type} onChange={e => dispatch({ type: 'SET_FIELD', field: 'type', value: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl">
                  <option value="rafting">Сплав</option>
                  <option value="hiking">Поход</option>
                  <option value="cycling">Велотур</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold mb-2">Дата *</label><input type="date" value={formData.date} onChange={e => dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-2">Время *</label><input type="time" value={formData.time} onChange={e => dispatch({ type: 'SET_FIELD', field: 'time', value: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
            </div>
            <div><label className="block text-sm font-bold mb-2">Место сбора *</label><input value={formData.location} onChange={e => dispatch({ type: 'SET_FIELD', field: 'location', value: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-bold mb-2">Длительность</label><input value={formData.duration} onChange={e => dispatch({ type: 'SET_FIELD', field: 'duration', value: e.target.value })} placeholder="7 часов" className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-2">Дистанция</label><input value={formData.distance} onChange={e => dispatch({ type: 'SET_FIELD', field: 'distance', value: e.target.value })} placeholder="24 км" className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-2">Сложность</label><select value={formData.difficulty} onChange={e => dispatch({ type: 'SET_FIELD', field: 'difficulty', value: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl"><option value="легкая">Легкая</option><option value="средняя">Средняя</option><option value="сложная">Сложная</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold mb-2">Мест всего *</label><input type="number" min="1" value={formData.spots} onChange={e => dispatch({ type: 'SET_FIELD', field: 'spots', value: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-2">Свободных мест</label><input type="number" min="0" value={formData.spots_left} onChange={e => dispatch({ type: 'SET_FIELD', field: 'spots_left', value: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-bold mb-2">Цена взрослый *</label><input type="number" min="0" value={formData.price_adult} onChange={e => dispatch({ type: 'SET_FIELD', field: 'price_adult', value: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-2">Цена детский</label><input type="number" min="0" value={formData.price_child} onChange={e => dispatch({ type: 'SET_FIELD', field: 'price_child', value: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-2">Цена семейный</label><input type="number" min="0" value={formData.price_family} onChange={e => dispatch({ type: 'SET_FIELD', field: 'price_family', value: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
            </div>
            <div><label className="block text-sm font-bold mb-2">URL изображения</label><input value={formData.image_url} onChange={e => dispatch({ type: 'SET_FIELD', field: 'image_url', value: e.target.value })} placeholder="https://..." className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl" /></div>
            <div><label className="block text-sm font-bold mb-2">Описание</label><textarea value={formData.description} onChange={e => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })} rows="3" className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl"></textarea></div>
            <div><label className="block text-sm font-bold mb-2">Маршрут</label><input value={formData.route} onChange={e => dispatch({ type: 'SET_FIELD', field: 'route', value: e.target.value })} placeholder="A → B → C" className="w-full px-4 py-2
