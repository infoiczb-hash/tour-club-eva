import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, X, CheckCircle, AlertCircle, Trash2, User, Phone, Plus, Lock, CheckSquare, Square } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- ХУКИ (Логика работы с базой) ---
const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  };
  
  useEffect(() => { loadEvents(); }, []);
  
  const addEvent = async (eventData) => {
    const { error } = await supabase.from('events').insert([eventData]);
    if (!error) await loadEvents();
    return { error };
  };

  const deleteEvent = async (id) => { 
    const r = await supabase.from('events').delete().eq('id', id); 
    if (!r.error) await loadEvents(); 
    return r; 
  };
  
  return { events, loading, addEvent, deleteEvent, refetch: loadEvents };
};

const useRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  
  const fetchRegistrations = async () => {
    const { data } = await supabase.from('registrations').select(`*, events(title)`).order('created_at', { ascending: false });
    if (data) setRegistrations(data);
  };

  const createRegistration = async (d) => await supabase.from('registrations').insert([d]);

  const updateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'new' ? 'done' : 'new';
    const { error } = await supabase.from('registrations').update({ status: newStatus }).eq('id', id);
    if (!error) await fetchRegistrations();
  };

  const deleteRegistration = async (id) => {
    const { error } = await supabase.from('registrations').delete().eq('id', id);
    if (!error) await fetchRegistrations();
  };
  
  return { registrations, fetchRegistrations, createRegistration, updateStatus, deleteRegistration };
};

// --- КОМПОНЕНТЫ ---

// 1. Модалка входа (Пароль)
const LoginModal = ({ onClose, onLogin }) => {
  const [pass, setPass] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass.toLowerCase() === 'admin') { // ПАРОЛЬ: admin
      onLogin();
    } else {
      alert('Неверный пароль!');
    }
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="text-teal-600"/> Вход для администратора</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input autoFocus type="password" placeholder="Введите пароль..." className="w-full p-3 border rounded-xl text-center text-lg tracking-widest" value={pass} onChange={e=>setPass(e.target.value)}/>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500">Отмена</button>
            <button type="submit" className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold">Войти</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. Модалка создания тура
const CreateEventModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: '', date: '', time: '08:00', location: '', 
    price_adult: '', spots_left: 10, 
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Новое приключение</h2>
          <button onClick={onClose}><X className="text-gray-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <input required className="w-full p-2 border rounded-lg" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="Название тура"/>
          <div className="grid grid-cols-2 gap-4">
            <input required type="date" className="w-full p-2 border rounded-lg" value={form.date} onChange={e=>setForm({...form, date: e.target.value})}/>
            <input type="time" className="w-full p-2 border rounded-lg" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
          </div>
          <input required className="w-full p-2 border rounded-lg" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} placeholder="Место сбора"/>
          <div className="grid grid-cols-2 gap-4">
            <input required type="number" className="w-full p-2 border rounded-lg" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} placeholder="Цена"/>
            <input required type="number" className="w-full p-2 border rounded-lg" value={form.spots_left} onChange={e=>setForm({...form, spots_left: e.target.value})} placeholder="Мест"/>
          </div>
          <input required className="w-full p-2 border rounded-lg" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} placeholder="Ссылка на фото"/>
          <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 mt-4">Создать</button>
        </form>
      </div>
    </div>
  );
};

// 3. Таблица заявок (с кнопками статуса)
const AdminRegistrations = ({ registrations, onToggleStatus, onDelete }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 bg-gray-50 border-b font-bold">Заявки ({registrations.length})</div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr><th className="p-4">Статус</th><th className="p-4">Клиент</th><th className="p-4">Тур</th><th className="p-4">Сумма</th><th className="p-4">Действия</th></tr>
        </thead>
        <tbody className="divide-y">
          {registrations.map((reg) => (
            <tr key={reg.id} className={`hover:bg-gray-50 ${reg.status === 'done' ? 'bg-green-50/50' : ''}`}>
              <td className="p-4 cursor-pointer" onClick={() => onToggleStatus(reg.id, reg.status || 'new')}>
                {reg.status === 'done' ? 
                  <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-100 px-2 py-1 rounded-md"><CheckSquare size={14}/> Оплачено</span> : 
                  <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded-md"><Square size={14}/> Новая</span>
                }
              </td>
              <td className="p-4">
                <div className="font-bold">{reg.name}</div>
                <div className="text-blue-600">{reg.phone}</div>
              </td>
              <td className="p-4 text-gray-600">{reg.events?.title || 'Удален'}</td>
              <td className="p-4 font-bold">{reg.total_price}₽</td>
              <td className="p-4">
                <button onClick={() => { if(window.confirm('Удалить заявку?')) onDelete(reg.id) }} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 4. Модалка записи
const BookingModal = ({ event, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', tickets: 1 });
  if (!event) return null;
  const totalPrice = event.price_adult * formData.tickets;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-1">Запись на тур</h2>
        <p className="text-teal-600 font-medium mb-6">{event.title}</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <input required type="text" className="w-full p-3 border rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Имя"/>
          <input required type="tel" className="w-full p-3 border rounded-xl" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Телефон"/>
          <input type="number" min="1" max={event.spots_left} className="w-full p-3 border rounded-xl" value={formData.tickets} onChange={e => setFormData({...formData, tickets: parseInt(e.target.value)})} />
          <div className="pt-4 border-t flex justify-between items-center">
            <p className="text-2xl font-bold text-teal-600">{totalPrice}₽</p>
            <button disabled={isSubmitting} type="submit" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">Записаться</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ГЛАВНОЕ ПРИЛОЖЕНИЕ ---
function App() {
  const { events, loading, addEvent, deleteEvent, refetch } = useEvents();
  const { registrations, fetchRegistrations, createRegistration, updateStatus, deleteRegistration } = useRegistrations();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // Показать ввод пароля
  
  const [viewMode, setViewMode] = useState('client'); // client, admin_events, admin_bookings
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (viewMode === 'admin_bookings') fetchRegistrations(); }, [viewMode]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminClick = (mode) => {
    // Если уже в админке - просто переключаем
    if (viewMode.startsWith('admin_')) {
      setViewMode(mode);
    } else {
      // Если клиент - просим пароль
      setShowLogin(mode); // Сохраняем, куда хотел попасть
    }
  };

  const handleLoginSuccess = () => {
    const targetMode = showLogin; // Куда хотел юзер
    setShowLogin(false);
    setViewMode(targetMode);
    showToast('Добро пожаловать, Админ!');
  };

  const handleRegister = async (formData) => {
    setIsSubmitting(true);
    const regData = { event_id: selectedEvent.id, name: formData.name, phone: formData.phone, tickets: formData.tickets, total_price: selectedEvent.price_adult * formData.tickets, status: 'new' };
    const { error } = await createRegistration(regData);
    if (!error) { showToast('Вы успешно записаны!'); await refetch(); setShowModal(false); } 
    else { showToast('Ошибка при записи', 'error'); }
    setIsSubmitting(false);
  };

  const handleCreateEvent = async (data) => {
    const { error } = await addEvent(data);
    if (!error) { showToast('Тур создан!'); setShowCreateModal(false); } 
    else { showToast('Ошибка создания', 'error'); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Удалить этот тур?')) { await deleteEvent(id); showToast('Тур удален'); }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-teal-600">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Шапка */}
      <header className={`text-white shadow-xl sticky top-0 z-40 ${viewMode !== 'client' ? 'bg-slate-800' : 'bg-teal-700'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold truncate">{viewMode !== 'client' ? 'Панель управления' : 'Турклуб "Эва" 🏔️'}</h1>
          <div className="flex bg-black/20 rounded-lg p-1 gap-1">
            <button onClick={() => setViewMode('client')} className={`px-2 md:px-3 py-1 rounded text-sm ${viewMode === 'client' ? 'bg-white text-teal-700 font-bold' : 'hover:bg-white/10'}`}>Сайт</button>
            <button onClick={() => handleAdminClick('admin_events')} className={`px-2 md:px-3 py-1 rounded text-sm ${viewMode === 'admin_events' ? 'bg-white text-slate-800 font-bold' : 'hover:bg-white/10'}`}>Туры</button>
            <button onClick={() => handleAdminClick('admin_bookings')} className={`px-2 md:px-3 py-1 rounded text-sm ${viewMode === 'admin_bookings' ? 'bg-white text-slate-800 font-bold' : 'hover:bg-white/10'}`}>Заявки</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* АДМИНКА ЗАЯВОК */}
        {viewMode === 'admin_bookings' && <AdminRegistrations registrations={registrations} onToggleStatus={updateStatus} onDelete={deleteRegistration} />}
        
        {/* КАРТОЧКИ ТУРОВ */}
        {viewMode !== 'admin_bookings' && (
          <>
            {viewMode === 'admin_events' && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition">
                  <Plus size={20}/> Добавить тур
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <article key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden group">
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-teal-700 shadow-sm">{event.price_adult} ₽</div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{event.title}</h3>
                    <div className="space-y-2 mb-6 text-gray-600 text-sm">
                      <div className="flex items-center gap-2"><Calendar size={16} className="text-teal-500" /><span>{formatDate(event.date)}</span></div>
                      <div className="flex items-center gap-2"><MapPin size={16} className="text-teal-500" /><span>{event.location}</span></div>
                    </div>
                    {viewMode === 'admin_events' ? (
                      <button onClick={() => handleDelete(event.id)} className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition"><Trash2 size={18} /> Удалить тур</button>
                    ) : (
                      <button onClick={() => { setSelectedEvent(event); setShowModal(true); }} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-teal-200 hover:shadow-lg active:scale-95">Записаться</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLoginSuccess} />}
      {showModal && <BookingModal event={selectedEvent} onClose={() => setShowModal(false)} onSubmit={handleRegister} isSubmitting={isSubmitting} />}
      {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateEvent} />}
      
      {toast && (
        <div className={`fixed bottom-8 right-4 z-[70] px-6 py-4 rounded-xl shadow-2xl text-white font-medium animate-bounce-in ${toast.type === 'success' ? 'bg-gray-800' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
