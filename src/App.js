import React, { useState, useEffect, useMemo, useReducer } from 'react';
import { Calendar, MapPin, Clock, Filter, X, Sparkles, TrendingUp, Award, Settings, Plus, Edit2, Trash2, Users, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').eq('is_active', true).order('date', { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  };
  
  useEffect(() => { loadEvents(); }, []);
  
  const addEvent = async (d) => { const r = await supabase.from('events').insert([d]); if (!r.error) await loadEvents(); return r; };
  const updateEvent = async (id, d) => { const r = await supabase.from('events').update(d).eq('id', id); if (!r.error) await loadEvents(); return r; };
  const deleteEvent = async (id) => { const r = await supabase.from('events').delete().eq('id', id); if (!r.error) await loadEvents(); return r; };
  
  return { events, loading, addEvent, updateEvent, deleteEvent, refetch: loadEvents };
};

const useRegistrations = () => {
  const createRegistration = async (d) => await supabase.from('registrations').insert([d]);
  return { createRegistration };
};

function App() {
  const { events, loading, addEvent, updateEvent, deleteEvent, refetch } = useEvents();
  const { createRegistration } = useRegistrations();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [toast, setToast] = useState(null);

  const handleRegister = async (formData) => {
    const regData = {
      event_id: selectedEvent.id,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      tickets: formData.tickets,
      ticket_type: formData.ticketType,
      total_price: selectedEvent[`price_${formData.ticketType}`] * formData.tickets
    };
    
    const { error } = await createRegistration(regData);
    if (!error) {
      setToast({ message: 'Спасибо за регистрацию!', type: 'success' });
      await refetch();
    } else {
      setToast({ message: 'Ошибка регистрации', type: 'error' });
    }
    setTimeout(() => setToast(null), 4000);
    setShowModal(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader size={48} className="animate-spin text-teal-600" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50">
      <header className="bg-gradient-to-r from-teal-600 via-blue-600 to-cyan-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black">Турклуб "Эва"</h1>
              <p className="text-lg">Приключения каждые выходные 🌄</p>
            </div>
            <button onClick={() => setViewMode(viewMode === 'admin' ? 'grid' : 'admin')} className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 flex gap-2">
              <Settings size={20} />
              <span>{viewMode === 'admin' ? 'Клиентам' : 'Админка'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => (
            <article key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition">
              <div className="relative h-56">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">{event.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} />
                    <span className="text-sm">{event.date} в {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span className="text-sm">{event.location}</span>
                  </div>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-bold">{event.spots_left} мест</span>
                  <span className="text-2xl font-bold text-teal-600">{event.price_adult}₽</span>
                </div>
                {viewMode !== 'admin' && (
                  <button onClick={() => { setSelectedEvent(event); setShowModal(true); }} className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700">
                    Записаться
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={20} /></button>
        </div>
      )}
    </div>
  );
}

export default App;
