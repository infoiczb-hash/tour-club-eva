import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarDays, Grid, Plus, Settings, Sparkles, Trash2, X, 
  CheckSquare, Square, Loader, Edit, DownloadCloud 
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { useEvents, ValidationUtils } from './lib/hooks';

// UX Components (Новые)
import Button from './components/ui/Button';
import { SkeletonGrid } from './components/ui/Skeleton';
import Toast from './components/Toast';

// Feature Components
import LanguageSwitcher from './components/LanguageSwitcher';
import EventCard from './components/EventCard';
import LoginModal from './components/LoginModal';
import CalendarView from './components/CalendarView';
import EventDetailsModal from './components/EventDetailsModal';
import EventFormModal from './components/EventFormModal';

// ============ CONSTANTS ============
const ViewModes = { GRID: 'grid', CALENDAR: 'calendar' };
const Languages = { RU: 'ru', EN: 'en', RO: 'ro' };
const EventTypes = { 
    WATER: 'water', HIKING_1: 'hiking_1', KIDS: 'kids', WEEKEND: 'weekend', EXPEDITION: 'expedition' 
};

// ============ TRANSLATIONS ============
const translations = {
  ru: {
    header: { title: 'Турклуб "Эва"', subtitle: 'Приключения каждые выходные 🌄' },
    filters: { 
        all: 'Все', 
        [EventTypes.WATER]: 'На воде 🛶', 
        [EventTypes.HIKING_1]: '1 день 🎒', 
        [EventTypes.KIDS]: 'Детские 👶', 
        [EventTypes.WEEKEND]: 'Выходные 🏕️', 
        [EventTypes.EXPEDITION]: 'Экспедиции 🏔️',
        'hiking': 'Походы'
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

// --- АДМИН: СПИСОК ЗАЯВОК + EXCEL ---
const AdminRegistrations = () => {
    const [regs, setRegs] = useState([]);
    
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('registrations').select(`*, events(title, date)`).order('created_at', { ascending: false });
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
        if(window.confirm('Удалить заявку?')) {
            await supabase.from('registrations').delete().eq('id', id);
            setRegs(regs.filter(r => r.id !== id));
        }
    }

    // Скачивание CSV
    const downloadCSV = () => {
        if (!regs.length) return alert('Нет данных');
        const headers = ['Статус', 'Дата Тура', 'Тур', 'Имя', 'Телефон', 'Билетов', 'Сумма', 'Создано'];
        const rows = regs.map(r => [
            r.status === 'new' ? 'Новая' : 'Оплачено',
            r.events?.date || '-',
            `"${r.events?.title || 'Удален'}"`,
            `"${r.name}"`,
            r.phone,
            r.tickets,
            r.total_price,
            new Date(r.created_at).toLocaleDateString()
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Заявки_EvaClub_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-800">📋 Все заявки ({regs.length})</h2>
                 <Button variant="primary" onClick={downloadCSV} className="!py-2 !px-4 text-sm bg-green-600 hover:bg-green-700 from-green-600 to-green-700 shadow-green-200">
                    <DownloadCloud size={18}/> Excel
                 </Button>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr><th className="p-4">Статус</th><th className="p-4">Тур</th><th className="p-4">Клиент</th><th className="p-4">Сумма</th><th className="p-4">Del</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {regs.map(r => (
                            <tr key={r.id} className="hover:bg-blue-50/50 transition">
                                <td className="p-4 cursor-pointer" onClick={()=>toggle(r.id, r.status||'new')}>
                                    {r.status==='done' 
                                        ? <span className="flex items-center gap-1 text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs"><CheckSquare size={14}/> OK</span> 
                                        : <span className="flex items-center gap-1 text-orange-500 font-bold bg-orange-100 px-2 py-1 rounded text-xs"><Square size={14}/> New</span>
                                    }
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-gray-800 max-w-xs truncate">{r.events?.title || 'Удален'}</div>
                                    <div className="text-xs text-gray-400">{r.events?.date ? new Date(r.events.date).toLocaleDateString() : '-'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">{r.name}</div>
                                    <div className="text-xs text-blue-500 font-mono">{r.phone}</div>
                                </td>
                                <td className="p-4 font-bold text-teal-600">{r.total_price}₽</td>
                                <td className="p-4"><button onClick={()=>del(r.id)} className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded"><Trash2 size={18}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============ MAIN APP ============
const TourClubWebsite = () => {
  const { events, loading, deleteEvent, bookEvent, uploadImage, createEvent, updateEvent, refreshEvents } = useEvents();
  
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [editingEvent, setEditingEvent] = useState(null); 

  const [showDetails, setShowDetails] = useState(false); 
  const [showRegModal, setShowRegModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState(ViewModes.GRID); 
  const [language, setLanguage] = useState(Languages.RU);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  
  const [regForm, setRegForm] = useState({ name: '', phone: '', tickets: 1 });
  const [regErrors, setRegErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[language];
  const isAdmin = viewMode.startsWith('admin');

  // --- Handlers ---
  const handleCreateOrUpdate = async (formData) => {
      let result;
      if (editingEvent) {
          result = await updateEvent(editingEvent.id, formData);
      } else {
          result = await createEvent(formData);
      }
      
      if (result.error) alert(result.error.message);
      else {
          setToast({ message: editingEvent ? 'Тур обновлен' : 'Тур создан', type: 'success' });
          setShowFormModal(false);
          setEditingEvent(null);
      }
  }

  const openEditModal = (event, e) => {
      e.stopPropagation(); 
      setEditingEvent(event);
      setShowFormModal(true);
  };

  const handleRegister = async (e) => {
      e.preventDefault();
      const errors = ValidationUtils.validateRegistration(regForm, selectedEvent.spotsLeft, t);
      setRegErrors(errors);
      if(Object.keys(errors).length > 0) return;

      setIsSubmitting(true);
      const { error } = await bookEvent({
          eventId: selectedEvent.id,
          formData: regForm,
          totalPrice: selectedEvent.price.adult * regForm.tickets
      });
      
      if(!error) {
          setToast({ message: t.messages.success, type: 'success' });
          setShowRegModal(false);
      } else {
          const msg = error.message === 'Not enough spots available' ? t.messages.full : t.messages.error;
          setToast({ message: msg, type: 'error' });
      }
      setIsSubmitting(false);
  }

  const handleDelete = async (id) => {
      if(window.confirm('Удалить?')) await deleteEvent(id);
  }

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [filterType, events]);

  const filterCategories = ['all', EventTypes.WATER, EventTypes.HIKING_1, EventTypes.KIDS, EventTypes.WEEKEND, EventTypes.EXPEDITION];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 font-sans">
      
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

      {/* CONTENT */}
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
                                <button key={type} onClick={()=>setFilterType(type)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${filterType===type ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-white text-gray-600 border-gray-100 hover:border-teal-200'}`}>{t.filters[type] || type}</button>
                            ))}
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <Button onClick={()=>{setEditingEvent(null); setShowFormModal(true);}} className="w-full mb-6 !py-4 border-2 border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 !bg-transparent !shadow-none !text-blue-500">
                        <Plus/> {t.admin.add}
                    </Button>
                )}

                {/* SKELETON LOADING */}
                {loading ? (
                    <SkeletonGrid />
                ) : (
                    <>
                        {viewMode === ViewModes.GRID || isAdmin ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredEvents.map((event, idx) => (
                                    <div key={event.id} className="relative group">
                                        <EventCard event={event} onSelect={(e)=>{setSelectedEvent(e); setShowDetails(true);}} index={idx} t={t} />
                                        {isAdmin && (
                                            <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={(e)=>openEditModal(event, e)} className="bg-white p-2 rounded-full text-blue-500 shadow-lg hover:bg-blue-50"><Edit size={20}/></button>
                                                <button onClick={(e)=>{e.stopPropagation(); handleDelete(event.id);}} className="bg-white p-2 rounded-full text-red-500 shadow-lg hover:bg-red-50"><Trash2 size={20}/></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredEvents.length === 0 && <div className="col-span-full text-center py-20 text-gray-400">В этой категории пока нет туров 🏔️</div>}
                            </div>
                        ) : (
                            <CalendarView events={filteredEvents} onSelect={(e)=>{setSelectedEvent(e); setShowDetails(true);}} currentLang={language} />
                        )}
                    </>
                )}
            </>
        )}
      </main>

      {/* MODALS */}
      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={()=>{setShowLogin(false); setViewMode('admin_tours');}} />}
      
      {showFormModal && (
          <EventFormModal 
            onClose={()=>{setShowFormModal(false); setEditingEvent(null);}} 
            onSubmit={handleCreateOrUpdate} 
            onUpload={uploadImage}
            initialData={editingEvent}
          />
      )}

      {showDetails && selectedEvent && (
          <EventDetailsModal 
            event={selectedEvent} 
            onClose={() => setShowDetails(false)} 
            onRegister={() => { setShowDetails(false); setRegForm({name:'', phone:'', tickets:1}); setRegErrors({}); setShowRegModal(true); }} 
            t={t} 
          />
      )}

      {showRegModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={()=>setShowRegModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setShowRegModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                <h2 className="text-xl font-bold mb-1 pr-8 text-gray-500">Регистрация</h2>
                <h3 className="text-2xl font-bold mb-4">{selectedEvent.title}</h3>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div><label className="text-sm font-bold text-gray-700 block mb-1">{t.form.name}</label><input value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition ${regErrors.name ? 'border-red-500' : 'border-gray-200'}`}/>{regErrors.name && <p className="text-red-500 text-xs mt-1">{regErrors.name}</p>}</div>
                    <div><label className="text-sm font-bold text-gray-700 block mb-1">{t.form.phone}</label><input type="tel" value={regForm.phone} onChange={e=>setRegForm({...regForm, phone: e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition ${regErrors.phone ? 'border-red-500' : 'border-gray-200'}`}/>{regErrors.phone && <p className="text-red-500 text-xs mt-1">{regErrors.phone}</p>}</div>
                    <div><label className="text-sm font-bold text-gray-700 block mb-1">{t.form.quantity}</label><input type="number" min="1" max={selectedEvent.spotsLeft} value={regForm.tickets} onChange={e=>setRegForm({...regForm, tickets: +e.target.value})} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition ${regErrors.tickets ? 'border-red-500' : 'border-gray-200'}`}/></div>
                    <div className="pt-4 border-t flex justify-between items-center">
                        <div><p className="text-sm text-gray-500">{t.form.total}</p><p className="text-2xl font-bold text-teal-600">{selectedEvent.price.adult * regForm.tickets}₽</p></div>
                        <Button isLoading={isSubmitting} variant="primary" className="shadow-lg shadow-teal-200">
                            {t.event.registerBtn}
                        </Button>
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
