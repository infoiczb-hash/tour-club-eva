import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Settings, X, CheckCircle, AlertCircle, Trash2, User, Phone, Ticket, Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- ХУКИ ---
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
  
  return { registrations, fetchRegistrations, createRegistration };
};

// --- МОДАЛКА СОЗДАНИЯ ТУРА ---
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

// --- СПИСОК ЗАЯВОК ---
const AdminRegistrations = ({ registrations }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 bg-gray-50 border-b font-bold">Список заявок ({registrations.length})</div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr><th className="p-4">Дата</th><th className="p-4">Имя</th><th className="p-4">Телефон</th><th className="p-4">Тур</th><th className="p-4">Сумма</th></tr>
        </thead>
        <tbody className="divide-y">
          {registrations.map((reg) => (
            <tr key={reg.id} className="hover:bg-gray-50">
              <td className="p-4">{new Date(reg.created_at).toLocaleDateString()}</td>
              <td className="p-4 font-medium">{reg.name}</td>
              <td className="p-4 text-blue-600">{reg.phone}</td>
              <td className="p-4">{reg.events?.title || 'Удален'}</td>
              <td className="p-4 text-teal-600 font-bold">{reg.total_price}₽</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- МОДАЛКА ЗАПИСИ ---
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

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
function App() {
  const { events, loading, addEvent, deleteEvent, refetch } = useEvents();
  const { registrations, fetchRegistrations, createRegistration } = useRegistrations();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('client');
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (viewMode === 'admin_bookings') fetchRegistrations(); }, [viewMode]);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegister = async (formData) => {
    setIsSubmitting(true);
    const regData = { event_id: selectedEvent.id, name: formData.name, phone: formData.phone, tickets: formData.tickets, total_price: selectedEvent.price_adult * formData.tickets };
    const { error } = await createRegistration(regData);
    if (!error) { showToast('Вы успешно записаны!'); await refetch(); setShowModal(false); } 
    else { showToast('Ошибка при записи', 'error'); }
    setIsSubmitting(false);
  };

  const handleCreateEvent = async (data) => {
    const { error } = await addEvent(data);
    if (!error) { showToast('Тур успешно создан!'); setShowCreateModal(false); } 
    else { showToast('Ошибка создания', 'error'); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Удалить этот тур?')) { await deleteEvent(id); showToast('Тур удален'); }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-teal-600">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className={`text-white shadow-xl sticky top-0 z-40 ${viewMode !== 'client' ? 'bg-slate-800' : 'bg-teal-700'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{viewMode !== 'client' ? 'Панель управления' : 'Турклуб "Эва" 🏔️'}</h1>
          <div className="flex bg-black/20 rounded-lg p-1 gap-1">
            <button onClick={() => setViewMode('client')} className={`px-3 py-1 rounded ${viewMode === 'client' ? 'bg-white text-teal-700' : ''}`}>Сайт</button>
            <button onClick={() => setViewMode('admin_events')} className={`px-3 py-1 rounded ${viewMode === 'admin_events' ? 'bg-white text-slate-800' : ''}`}>Туры</button>
            <button onClick={() => setViewMode('admin_bookings')} className={`px-3 py-1 rounded ${viewMode === 'admin_bookings' ? 'bg-white text-slate-800' : ''}`}>Заявки</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {viewMode === 'admin_bookings' && <AdminRegistrations registrations={registrations} />}
        
        {viewMode !== 'admin_bookings' && (
          <>
            {viewMode === 'admin_events' && (
              <div className="mb-6 flex justify-end">
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">
                  <Plus size={20}/> Добавить тур
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <article key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden">
                  <div className="relative h-48 bg-gray-200">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-teal-700">{event.price_adult} ₽</div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <div className="space-y-2 mb-6 text-gray-600 text-sm">
                      <div className="flex items-center gap-2"><Calendar size={16} /><span>{formatDate(event.date)}</span></div>
                      <div className="flex items-center gap-2"><MapPin size={16} /><span>{event.location}</span></div>
                    </div>
                    {viewMode === 'admin_events' ? (
                      <button onClick={() => handleDelete(event.id)} className="w-full bg-red-50 text-red-600 py-2 rounded-xl font-medium flex items-center justify-center gap-2"><Trash2 size={18} /> Удалить</button>
                    ) : (
                      <button onClick={() => { setSelectedEvent(event); setShowModal(true); }} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">Записаться</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {showModal && <BookingModal event={selectedEvent} onClose={() => setShowModal(false)} onSubmit={handleRegister} isSubmitting={isSubmitting} />}
      {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateEvent} />}
      
      {toast && (
        <div className={`fixed bottom-8 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
