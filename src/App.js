import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Grid, Plus, Settings, Sparkles, Trash2, X, CheckSquare, Square, Loader, UploadCloud } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useEvents, ValidationUtils } from './lib/hooks';

// UI Components
import Toast from './components/Toast';
import LanguageSwitcher from './components/LanguageSwitcher';
import EventCard from './components/EventCard';
import LoginModal from './components/LoginModal';
import CalendarView from './components/CalendarView';

// ============ CONSTANTS ============
const ViewModes = { GRID: 'grid', CALENDAR: 'calendar' };
const Languages = { RU: 'ru', EN: 'en', RO: 'ro' };
const EventTypes = { 
    WATER: 'water',       
    HIKING_1: 'hiking_oneday', 
    KIDS: 'kids',         
    WEEKEND: 'weekend',   
    EXPEDITION: 'expedition' 
};

// ============ TRANSLATIONS ============
const translations = {
  ru: {
    header: { title: 'Турклуб "Эва"', subtitle: 'Приключения каждые выходные выходные' },
    filters: { 
        all: 'Все', 
        [EventTypes.WATER]: 'На воде', 
        [EventTypes.HIKING_1]: 'Выезды на 1 день', 
        [EventTypes.KIDS]: 'Подросткам',
        [EventTypes.WEEKEND]: 'Походы на выходные',
        [EventTypes.EXPEDITION]: 'Экспедиции ',
        'hiking': 'Походы' // fallback
    },
    event: { register: 'Записаться', spots: 'мест', registerBtn: 'Записаться' },
    form: { name: 'Ваше имя *', phone: 'Телефон *', quantity: 'Количество', total: 'Итого:', submit: 'Зарегистрироваться' },
    validation: { nameRequired: 'Укажите имя', phoneRequired: 'Укажите телефон', invalidPhone: 'Некорректный формат' },
    messages: { success: 'Спасибо за регистрацию! ✓', error: 'Ошибка регистрации ✗', full: 'Места закончились 😔' },
    admin: { title: 'Панель управления', tours: 'Туры', bookings: 'Заявки', add: 'Добавить тур' }
  },
  en: {
    header: { title: 'Tour Club "Eva"', subtitle: 'Adventures every weekend 🌄' },
    filters: { all: 'All', water: 'Water', hiking_1: '1 Day', kids: 'Kids', weekend: 'Weekend', expedition: 'Expedition' },
    event: { register: 'Register', spots: 'spots', registerBtn: 'Register' },
    form: { name: 'Your name *', phone: 'Phone *', quantity: 'Quantity', total: 'Total:', submit: 'Register' },
    validation: { nameRequired: 'Enter name', phoneRequired: 'Enter phone', invalidPhone: 'Invalid format' },
    messages: { success: 'Registration successful!', error: 'Error', full: 'No spots left' },
    admin: { title: 'Admin Panel', tours: 'Tours', bookings: 'Bookings', add: 'Add Tour' }
  },
  ro: {
    header: { title: 'Club turistic "Eva"', subtitle: 'Aventuri în fiecare weekend 🌄' },
    filters: { all: 'Toate', water: 'Apă', hiking_1: '1 Zi', kids: 'Copii', weekend: 'Weekend', expedition: 'Expediție' },
    event: { register: 'Înscrie-te', spots: 'locuri', registerBtn: 'Înregistrare' },
    form: { name: 'Nume *', phone: 'Telefon *', quantity: 'Cantitate', total: 'Total:', submit: 'Înregistrare' },
    validation: { nameRequired: 'Introdu nume', phoneRequired: 'Introdu telefon', invalidPhone: 'Format invalid' },
    messages: { success: 'Înregistrare reușită!', error: 'Eroare', full: 'Fără locuri' },
    admin: { title: 'Panou Admin', tours: 'Tururi', bookings: 'Rezervări', add: 'Adaugă' }
  }
};

// --- АДМИН: СПИСОК ЗАЯВОК ---
const AdminRegistrations = () => {
    const [regs, setRegs] = useState([]);
    useEffect(() => {
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

// --- АДМИН: СОЗДАНИЕ ТУРА ---
const CreateEventModal = ({ onClose, onRefresh }) => {
    const [form, setForm] = useState({ 
        title: '', date: '', time: '08:00', location: '', guide: '',
        price_adult: '', spots_left: 20, spots: 20, 
        image_url: '', type: 'hiking_1',
        duration: '', difficulty: 'средняя'
    });
    
    const submit = async (e) => {
        e.preventDefault();
        const dataToSend = { ...form, spots_left: form.spots };
        const { error } = await supabase.from('events').insert([dataToSend]);
        if(!error) { onRefresh(); onClose(); }
        else alert(error.message);
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Новый тур</h2>
                <form onSubmit={submit} className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Название" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <select className="w-full p-2 border rounded bg-white" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                            <option value="hiking_1">🎒 1 день</option>
                            <option value="water">🛶 На воде</option>
                            <option value="kids">👶 Детский</option>
                            <option value="weekend">🏕️ Выходные</option>
                            <option value="expedition">🏔️ Экспедиция</option>
                        </select>
                        <input className="w-full p-2 border rounded" placeholder="Локация" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="w-full p-2 border rounded" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                        <input type="time" className="w-full p-2 border rounded" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                    </div>

                    {/* НОВОЕ ПОЛЕ: ГИД */}
                    <input className="w-full p-2 border rounded" placeholder="Имя гида (напр. Александр)" value={form.guide} onChange={e=>setForm({...form, guide: e.target.value})} />

                    <div className="grid grid-cols-2 gap-2">
                         <input className="w-full p-2 border rounded" placeholder="Длительность (7ч)" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})} />
                         <select className="w-full p-2 border rounded bg-white" value={form.difficulty} onChange={e=>setForm({...form, difficulty: e.target.value})}>
                            <option value="легкая">Легкая</option>
                            <option value="средняя">Средняя</option>
                            <option value="сложная">Сложная</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                         <input type="number" className="w-full p-2 border rounded" placeholder="Цена" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                         <input type="number" className="w-full p-2 border rounded" placeholder="Всего мест" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>
                    
                    {/* ЗАГРУЗКА ФОТО (UI) */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer relative group">
                        <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if(file) alert(`Выбран файл: ${file.name} (Загрузка будет на след. этапе)`);
                            }} 
                        />
                        <div className="flex flex-col items-center text-gray-400">
                            <UploadCloud size={24} className="mb-1"/>
                            <p className="text-xs">Фото тура</p>
                        </div>
                    </div>
                    
                    <input className="w-full p-2 border rounded text-sm text-gray-500" placeholder="Или ссылка URL" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})}/>
                    
                    <button className="w-full bg-teal-600 text-white py-3 rounded font-bold">Создать</button>
                    <button type="button" onClick={onClose} className="w-full text-gray-500 py-2">Отмена</button>
                </form>
            </div>
        </div>
    )
}

// ============ ГЛАВНОЕ ПРИЛОЖЕНИЕ ============
const TourClubWebsite = () => {
  // Используем bookEvent из хука
  const { events, loading, refreshEvents, deleteEvent, bookEvent } = useEvents();
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState(ViewModes.GRID); 
  const [language, setLanguage] = useState(Languages.RU);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  
  const [regForm, setRegForm] = useState({ name: '', phone: '', tickets: 1 });
  const [regErrors, setRegErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[language];
  const isAdmin = viewMode.startsWith('admin');

  // РЕГИСТРАЦИЯ (С ЗАЩИТОЙ)
  const handleRegister = async (e) => {
      e.preventDefault();
      
      const errors = ValidationUtils.validateRegistration(regForm, selectedEvent.spotsLeft, t);
      setRegErrors(errors);
      if(Object.keys(errors).length > 0) return;

      setIsSubmitting(true);

      // ВЫЗОВ БЕЗОПАСНОЙ ФУНКЦИИ
      const { error } = await bookEvent({
          eventId: selectedEvent.id,
          formData: regForm,
          totalPrice: selectedEvent.price.adult * regForm.tickets
      });
      
      if(!error) {
          setToast({ message: t.messages.success, type: 'success' });
          setShowModal(false);
          // refreshEvents() вызывается внутри хука
      } else {
          // Если ошибка пришла из базы (например "Места закончились")
          const msg = error.message === 'Not enough spots available' ? t.messages.full : t.messages.error;
          setToast({ message: msg, type: 'error' });
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

  const filterCategories = ['all', EventTypes.WATER, EventTypes.HIKING_1, EventTypes.KIDS, EventTypes.WEEKEND, EventTypes.EXPEDITION];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 font-sans">
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

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {viewMode === 'admin_bookings' && <AdminRegistrations />}

        {viewMode !== 'admin_bookings' && (
            <>
                {!isAdmin && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeIn">
                        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm">
                            <button onClick={() => setViewMode(ViewModes.GRID)} className={`p-2 rounded-lg transition ${viewMode === ViewModes.GRID ? 'bg-teal-50 text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Grid size={20}/></button>
                            <button onClick={() => setViewMode(ViewModes.CALENDAR)} className={`p-2 rounded-lg transition ${viewMode === ViewModes.CALENDAR ? 'bg-teal-50 text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><CalendarDays size={20}/></button>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                            {filterCategories.map(type => (
                                <button 
                                    key={type} 
                                    onClick={()=>setFilterType(type)} 
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${filterType===type ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-white text-gray-600 border-gray-100 hover:border-teal-200'}`}
                                >
                                    {t.filters[type] || type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <button onClick={()=>setShowCreate(true)} className="w-full py-4 mb-6 border-2 border-dashed border-blue-300 text-blue-500 rounded-2xl font-bold hover:bg-blue-50 flex items-center justify-center gap-2 transition">
                        <Plus/> {t.admin.add}
                    </button>
                )}

                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-teal-600" size={40}/></div>
                ) : (
                    <>
                        {viewMode === ViewModes.GRID || isAdmin ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredEvents.map((event, idx) => (
                                    <div key={event.id} className="relative group">
                                        <EventCard event={event} onSelect={openRegModal} index={idx} t={t} />
                                        {isAdmin && (
                                            <button onClick={()=>handleDelete(event.id)} className="absolute top-2 right-2 bg-white p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-50">
                                                <Trash2 size={20}/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {filteredEvents.length === 0 && (
                                    <div className="col-span-full text-center py-20 text-gray-400">
                                        В этой категории пока нет туров 🏔️
                                    </div>
                                )}
                            </div>
                        ) : (
                            <CalendarView events={filteredEvents} onSelect={openRegModal} currentLang={language} />
                        )}
                    </>
                )}
            </>
        )}
      </main>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={()=>{setShowLogin(false); setViewMode('admin_tours');}} />}
      {showCreate && <CreateEventModal onClose={()=>setShowCreate(false)} onRefresh={refreshEvents} />}
      
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={()=>setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                <h2 className="text-2xl font-bold mb-1 pr-8">{selectedEvent.title}</h2>
                <div className="flex gap-2 text-sm mb-6">
                    <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{selectedEvent.time?.slice(0,5)}</span>
                </div>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">{t.form.name}</label>
                        <input value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition ${regErrors.name ? 'border-red-500' : 'border-gray-200'}`}/>
                        {regErrors.name && <p className="text-red-500 text-xs mt-1">{regErrors.name}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">{t.form.phone}</label>
                        <input type="tel" value={regForm.phone} onChange={e=>setRegForm({...regForm, phone: e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition ${regErrors.phone ? 'border-red-500' : 'border-gray-200'}`}/>
                        {regErrors.phone && <p className="text-red-500 text-xs mt-1">{regErrors.phone}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">{t.form.quantity} <span className="text-gray-400 font-normal">({t.event.spots} {selectedEvent.spotsLeft})</span></label>
                        <input type="number" min="1" max={selectedEvent.spotsLeft} value={regForm.tickets} onChange={e=>setRegForm({...regForm, tickets: +e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition ${regErrors.tickets ? 'border-red-500' : 'border-gray-200'}`}/>
                        {regErrors.tickets && <p className="text-red-500 text-xs mt-1">{regErrors.tickets}</p>}
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                        <div><p className="text-sm text-gray-500">{t.form.total}</p><p className="text-2xl font-bold text-teal-600">{selectedEvent.price.adult * regForm.tickets}₽</p></div>
                        <button disabled={isSubmitting} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition shadow-lg shadow-teal-200">
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
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; animation-fill-mode: both; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease-out; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TourClubWebsite;
