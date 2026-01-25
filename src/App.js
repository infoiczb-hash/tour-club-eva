import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Settings, X, CheckCircle, AlertCircle, Trash2, Edit2, User, Phone, Ticket } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- ХУКИ ---
const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
      
    if (!error) setEvents(data || []);
    setLoading(false);
  };
  
  useEffect(() => { loadEvents(); }, []);
  
  const deleteEvent = async (id) => { 
    const r = await supabase.from('events').delete().eq('id', id); 
    if (!r.error) await loadEvents(); 
    return r; 
  };
  
  return { events, loading, deleteEvent, refetch: loadEvents };
};

const useRegistrations = () => {
  const createRegistration = async (d) => await supabase.from('registrations').insert([d]);
  return { createRegistration };
};

// --- КОМПОНЕНТ МОДАЛЬНОГО ОКНА ---
const BookingModal = ({ event, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', tickets: 1, ticketType: 'adult' });

  if (!event) return null;

  const price = event.price_adult; 
  const totalPrice = price * formData.tickets;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-1">Запись на тур</h2>
        <p className="text-teal-600 font-medium mb-6">{event.title}</p>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex gap-2">
              <User size={16}/> Имя
            </label>
            <input 
              required 
              type="text" 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Иван Иванов"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex gap-2">
                <Phone size={16}/> Телефон
              </label>
              <input 
                required 
                type="tel" 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="+7..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex gap-2">
                <Ticket size={16}/> Билетов
              </label>
              <input 
                type="number" 
                min="1" 
                max={event.spots_left} 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                value={formData.tickets} 
                onChange={e => setFormData({...formData, tickets: parseInt(e.target.value)})} 
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Итого к оплате:</p>
              <p className="text-2xl font-bold text-teal-600">{totalPrice}₽</p>
            </div>
            <button 
              disabled={isSubmitting} 
              type="submit" 
              className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Запись...' : 'Подтвердить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
function App() {
  const { events, loading, deleteEvent, refetch } = useEvents();
  const { createRegistration } = useRegistrations();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (formData) => {
    setIsSubmitting(true);
    const regData = {
      event_id: selectedEvent.id,
      name: formData.name,
      phone: formData.phone,
      tickets: formData.tickets,
      total_price: selectedEvent.price_adult * formData.tickets,
      status: 'new'
    };
    
    const { error } = await createRegistration(regData);
    
    if (!error) {
      setToast({ message: 'Вы успешно записаны!', type: 'success' });
      await refetch();
      setShowModal(false);
    } else {
      setToast({ message: 'Ошибка при записи :(', type: 'error' });
    }
    setIsSubmitting(false);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id) => {
    if(window.confirm('Удалить этот тур?')) {
        await deleteEvent(id);
        setToast({ message: 'Тур удален', type: 'success' });
        setTimeout(() => setToast(null), 3000);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-teal-600">
      Загрузка туров...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Шапка */}
      <header className="bg-teal-700 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Турклуб "Эва" 🏔️</h1>
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'admin' ? 'grid' : 'admin')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              viewMode === 'admin' ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Settings size={16} />
            {viewMode === 'admin' ? 'Режим Админа' : 'Войти как админ'}
          </button>
        </div>
      </header>

      {/* Сетка туров */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <article key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 flex flex-col overflow-hidden border border-gray-100">
              <div className="relative h-48 bg-gray-200">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-teal-700 shadow-sm">
                  {event.price_adult} ₽
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                
                <div className="space-y-2 mb-6 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-teal-500" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-teal-500" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  {viewMode === 'admin' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(event.id)} 
                        className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl font-medium hover:bg-red-200 transition flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} /> Удалить
                      </button>
                      <button className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-xl font-medium hover:bg-blue-200 transition flex items-center justify-center gap-2">
                        <Edit2 size={18} /> Изм.
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setSelectedEvent(event); setShowModal(true); }} 
                      className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-teal-200 hover:shadow-lg active:scale-95 transform duration-100"
                    >
                      Записаться ({event.spots_left} мест)
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Модальное окно */}
      {showModal && (
        <BookingModal 
          event={selectedEvent} 
          onClose={() => setShowModal(false)} 
          onSubmit={handleRegister} 
          isSubmitting={isSubmitting}
        />
      )}

      {/* Тосты */}
      {toast && (
        <div className={`fixed bottom-8 right-4 md:right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
          toast.type === 'success' ? 'bg-gray-900 text-green-400' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
