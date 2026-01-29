import React, { useState, useMemo } from 'react';
import { CalendarDays, Grid, Plus, Settings, Sparkles, Trash2, X, CheckSquare, Square, Loader } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useEvents, ValidationUtils } from './lib/hooks'; // Импорт логики

// UI Components
import Toast from './components/Toast';
import LanguageSwitcher from './components/LanguageSwitcher';
import EventCard from './components/EventCard';
import LoginModal from './components/LoginModal';
import CalendarView from './components/CalendarView'; // Импорт календаря

// ============ CONSTANTS & CONFIG ============
const ViewModes = { GRID: 'grid', CALENDAR: 'calendar' };
const Languages = { RU: 'ru', EN: 'en', RO: 'ro' };

// ============ TRANSLATIONS ============
const translations = {
  ru: {
    header: { title: 'Турклуб "Эва"', subtitle: 'Приключения каждые выходные 🌄' },
    filters: { all: 'Все', rafting: 'Сплавы', hiking: 'Походы', cycling: 'Велотуры' },
    event: { register: 'Записаться', spotsLeft: 'мест', registerBtn: 'Записаться' },
    form: { name: 'Ваше имя *', phone: 'Телефон *', quantity: 'Количество', total: 'Итого:', submit: 'Зарегистрироваться' },
    validation: { nameRequired: 'Укажите имя', phoneRequired: 'Укажите телефон', invalidPhone: 'Некорректный формат' },
    messages: { success: 'Спасибо за регистрацию! ✓', error: 'Ошибка регистрации ✗' },
    admin: { title: 'Панель управления', tours: 'Туры', bookings: 'Заявки', add: 'Добавить тур' }
  },
  en: {
    header: { title: 'Tour Club "Eva"', subtitle: 'Adventures every weekend 🌄' },
    filters: { all: 'All', rafting: 'Rafting', hiking: 'Hiking', cycling: 'Cycling' },
    event: { register: 'Register', spotsLeft: 'spots', registerBtn: 'Register' },
    form: { name: 'Your name *', phone: 'Phone *', quantity: 'Quantity', total: 'Total:', submit: 'Register' },
    validation: { nameRequired: 'Enter name', phoneRequired: 'Enter phone', invalidPhone: 'Invalid format' },
    messages: { success: 'Registration successful!', error: 'Error' },
    admin: { title: 'Admin Panel', tours: 'Tours', bookings: 'Bookings', add: 'Add Tour' }
  },
  ro: {
    header: { title: 'Club turistic "Eva"', subtitle: 'Aventuri în fiecare weekend 🌄' },
    filters: { all: 'Toate', rafting: 'Rafting', hiking: 'Drumeții', cycling: 'Ciclism' },
    event: { register: 'Înscrie-te', spotsLeft: 'locuri', registerBtn: 'Înregistrare' },
    form: { name: 'Nume *', phone: 'Telefon *', quantity: 'Cantitate', total: 'Total:', submit: 'Înregistrare' },
    validation: { nameRequired: 'Introdu nume', phoneRequired: 'Introdu telefon', invalidPhone: 'Format invalid' },
    messages: { success: 'Înregistrare reușită!', error: 'Eroare' },
    admin: { title: 'Panou Admin', tours: 'Tururi', bookings: 'Rezervări', add: 'Adaugă' }
  }
};

// --- АДМИН МОДУЛИ (Оставляем пока здесь, следующим этапом вынесем в admin/) ---
const AdminRegistrations = () => {
    const [regs, setRegs] = useState([]);
    React.useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('registrations').select(`*, events(title)`).order('created_at', { ascending: false });
            if(data) setRegs(data);
        };
        fetch();
    }, []);
    const toggle = async (id, st) => {
        const ns = st === 'new' ? 'done' : 'new';
        await supabase.from('registrations').update({status: ns}).eq('id', id);
        setRegs(regs.map(r => r.id === id ? {...r, status: ns} : r));
    }
    const del = async (id) => {
        if(window.confirm('Удалить?')) {
            await supabase.from('registrations').delete().eq('id', id);
            setRegs(regs.filter(r => r.id !== id));
        }
    }
    return (
        <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50"><tr><th className="p-3">Статус</th><th className="p-3">Имя</th><th className="p-3">Тур</th><th className="p-3">Сумма</th><th className="p-3">Del</th></tr></thead>
                <tbody>
                    {regs.map(r => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 cursor-pointer" onClick={()=>toggle(r.id, r.status||'new')}>{r.status==='done' ? <CheckSquare className="text-green-500"/> : <Square className="text-orange-500"/>}</td>
                            <td className="p-3 font-bold">{r.name}<div className="text-xs text-blue-500">{r.phone}</div></td>
                            <td className="p-3">{r.events?.title}</td>
                            <td className="p-3">{r.total_price}₽</td>
                            <td className="p-3"><button onClick={()=>del(r.id)}><Trash2 size={16} className="text-red-400"/></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const CreateEventModal = ({ onClose, onRefresh }) => {
    const [form, setForm] = useState({ title: '', date: '', time: '08:00', location: '', price_adult: '', spots_left: 10, image_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d' });
    const submit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('events').insert([form]);
        if(!error) { onRefresh(); onClose(); }
    }
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Новый тур</h2>
                <form onSubmit={submit} className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Название" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="w-full p-2 border rounded" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                        <input type="time" className="w-full p-2 border rounded" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                    </div>
                    <input className="w-full p-2 border rounded" placeholder="Локация" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-2">
                         <input type="number" className="w-full p-2 border rounded" placeholder="Цена" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                         <input type="number" className="w-full p-2 border rounded" placeholder="Мест" value={form.spots_left} onChange={e=>setForm({...form, spots_left: e.target.value})} required/>
                    </div>
                    <input className="w-full p-2 border rounded" placeholder="Ссылка на фото" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})}/>
                    <button className="w-full bg-teal-600 text-white py-3 rounded font-bold">Создать</button>
                    <button type="button" onClick={onClose} className="w-full text-gray-500 py-2">Отмена</button>
                </form>
            </div>
        </div>
    )
}

// ============ ГЛАВНОЕ ПРИЛОЖЕНИЕ ============
const TourClubWebsite = () => {
  // Хук данных
  const { events, loading, refreshEvents, deleteEvent } = useEvents();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState(ViewModes.GRID); 
  const [language, setLanguage] = useState(Languages.RU);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  
  // Форма регистрации
  const [regForm, setRegForm] = useState({ name: '', phone: '', tickets: 1 });
  const [regErrors, setRegErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[language];
  const isAdmin = viewMode.startsWith('admin');

  // Регистрация
  const handleRegister = async (e) => {
      e.preventDefault();
      
      const errors = ValidationUtils.validateRegistration(regForm, selectedEvent.spotsLeft, t);
      setRegErrors(errors);
      
      if(Object.keys(errors).length > 0) return;

      setIsSubmitting(true);
      const regData = {
          event_id: selectedEvent.id,
          name: regForm.name,
          phone: regForm.phone,
          tickets: regForm.tickets,
          total_price: selectedEvent.price.adult * regForm.tickets,
          status: 'new'
      };
      const { error } = await supabase.from('registrations').insert([regData]);
      if(!error) {
          setToast({ message: t.messages.success, type: 'success' });
          setShowModal(false);
          refreshEvents(); 
      } else {
          setToast({ message: t.messages.error, type: 'error' });
      }
      setIsSubmitting(false);
  }

  const handleDelete = async (id) => {
      if(window.confirm('Удалить?')) {
          await deleteEvent(id);
      }
  }

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [filterType, events]);

  const openRegModal = (event) => {
      setSelectedEvent(event); 
      setRegForm({name:'', phone:'', tickets:1}); 
      setRegErrors({});
      setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 font-sans">
      {/* ФОН */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      {/* HEADER */}
      <header className={`relative text-white shadow-2xl transition-colors duration-500 ${isAdmin ? 'bg-slate-800' : 'bg-gradient-to-r from-teal-600 via-blue-600 to-cyan-600'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3 animate-fadeInLeft">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">{isAdmin ? t.admin.title : t.header.title}</h1>
                  {!isAdmin && <p className="text-sm opacity-90">{t.header.subtitle}</p>}
                </div>
             </div>

             <div className="flex flex-col items-end gap-2 animate-fadeInRight">
                <div className="flex gap-2 items-center">
                    <LanguageSwitcher currentLang={language} onChange={setLanguage} />
                    <button onClick={() => isAdmin ? setViewMode('grid') : setShowLogin(true)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white">
                        {isAdmin ? <X size={16}/> : <Settings size={16}/>}
                    </button>
                </div>
                {isAdmin && (
                    <div className="flex gap-2 mt-2">
                        <button onClick={()=>setViewMode('admin_tours')} className={`px-3 py-1 rounded text-sm font-bold ${viewMode==='admin_tours' ? 'bg-white text-slate-800' : 'bg-slate-700'}`}>{t.admin.tours}</button>
                        <button onClick={()=>setViewMode('admin_bookings')} className={`px-3 py-1 rounded text-sm font-bold ${viewMode==='admin_bookings' ? 'bg-white text-slate-800' : 'bg-slate-700'}`}>{t.admin.bookings}</button>
                    </div>
                )}
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* АДМИН: ЗАЯВКИ */}
        {viewMode === 'admin_bookings' && <AdminRegistrations />}

        {/* ОСНОВНОЙ КОНТЕНТ */}
        {viewMode !== 'admin_bookings' && (
            <>
                {!isAdmin && (
                    <div className="flex justify-between items-center mb-8 flex-wrap gap-4 animate-fadeIn">
                        <div className="flex gap-2">
                            <button onClick={() => setViewMode(ViewModes.GRID)} className={`p-2 rounded-lg ${viewMode === ViewModes.GRID ? 'bg-white text-teal-600 shadow' : 'text-gray-500 hover:bg-white/50'}`}><Grid size={20}/></button>
                            <button onClick={() => setViewMode(ViewModes.CALENDAR)} className={`p-2 rounded-lg ${viewMode === ViewModes.CALENDAR ? 'bg-white text-teal-600 shadow' : 'text-gray-500 hover:bg-white/50'}`}><CalendarDays size={20}/></button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {['all', 'rafting', 'hiking', 'cycling'].map(type => (
                                <button key={type} onClick={()=>setFilterType(type)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType===type ? 'bg-teal-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-teal-50'}`}>
                                    {t.filters[type]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <button onClick={()=>setShowCreate(true)} className="w-full py-4 mb-6 border-2 border-dashed border-blue-300 text-blue-500 rounded-2xl font-bold hover:bg-blue-50 flex items-center justify-center gap-2">
                        <Plus/> {t.admin.add}
                    </button>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-teal-600" size={40}/></div>
                ) : (
                    <>
                        {/* ВИД: СЕТКА */}
                        {viewMode === ViewModes.GRID || isAdmin ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredEvents.map((event, idx) => (
                                    <div key={event.id} className="relative group">
                                        <EventCard event={event} onSelect={openRegModal} index={idx} t={t} />
                                        {isAdmin && (
                                            <button onClick={()=>handleDelete(event.id)} className="absolute top-2 right-2 bg-red-100 p-2 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition shadow-lg z-10">
                                                <Trash2 size={20}/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                        // ВИД: КАЛЕНДАРЬ (НОВЫЙ)
                            <CalendarView events={filteredEvents} onSelect={openRegModal} currentLang={language} />
                        )}
                    </>
                )}
            </>
        )}
      </main>

      {/* МОДАЛКИ */}
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={()=>{setShowLogin(false); setViewMode('admin_tours');}} />}
      {showCreate && <CreateEventModal onClose={()=>setShowCreate(false)} onRefresh={refreshEvents} />}
      
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={()=>setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                <h2 className="text-2xl font-bold mb-1">{selectedEvent.title}</h2>
                <p className="text-teal-600 font-medium mb-6">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">{t.form.name}</label>
                        <input value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 ${regErrors.name ? 'border-red-500' : ''}`}/>
                        {regErrors.name && <p className="text-red-500 text-xs mt-1">{regErrors.name}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">{t.form.phone}</label>
                        <input type="tel" value={regForm.phone} onChange={e=>setRegForm({...regForm, phone: e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 ${regErrors.phone ? 'border-red-500' : ''}`}/>
                        {regErrors.phone && <p className="text-red-500 text-xs mt-1">{regErrors.phone}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">{t.form.quantity}</label>
                        <input type="number" min="1" max={selectedEvent.spotsLeft} value={regForm.tickets} onChange={e=>setRegForm({...regForm, tickets: +e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 ${regErrors.tickets ? 'border-red-500' : ''}`}/>
                        {regErrors.tickets && <p className="text-red-500 text-xs mt-1">{regErrors.tickets}</p>}
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                        <div><p className="text-sm text-gray-500">{t.form.total}</p><p className="text-2xl font-bold text-teal-600">{selectedEvent.price.adult * regForm.tickets}₽</p></div>
                        <button disabled={isSubmitting} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">
                            {isSubmitting ? <Loader className="animate-spin"/> : t.event.registerBtn}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; animation-fill-mode: both; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease-out; }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default TourClubWebsite;
