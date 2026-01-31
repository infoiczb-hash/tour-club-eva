import React, { useState, useMemo } from 'react';  
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import { 
  CalendarDays, Grid, Plus, Trash2, X, Edit 
} from 'lucide-react';
import { useEvents } from './lib/hooks'; 
 
// UX Components
import Button from './components/ui/Button';
import { SkeletonGrid } from './components/ui/Skeleton';
import Toast from './components/Toast';
 
// Feature Components
import EventCard from './components/EventCard';
import LoginModal from './components/LoginModal';
import CalendarView from './components/CalendarView';
import EventFormModal from './components/EventFormModal';
import TourPage from './components/TourPage';

// SECTIONS (Импортируем наши новые блоки)
import Hero from './components/sections/Hero';
import Footer from './components/sections/Footer'; // <--- Добавили импорт
 
// ============ CONSTANTS & TRANSLATIONS ============
const ViewModes = { GRID: 'grid', CALENDAR: 'calendar' };
const Languages = { RU: 'ru', EN: 'en', RO: 'ro' };
const EventTypes = { 
  WATER: 'water', HIKING_1: 'hiking_1', KIDS: 'kids', WEEKEND: 'weekend', EXPEDITION: 'expedition' 
};
 
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
    validation: { nameRequired: 'Укажите имя', phoneRequired: 'Укажите телефон' },
    messages: { success: 'Спасибо за регистрацию! ✓', error: 'Ошибка регистрации ✗', full: 'Места закончились 😔' },
    admin: { title: 'Панель управления', tours: 'Туры', bookings: 'Заявки', add: 'Добавить тур' }
  },
};
 
// ============ HOME PAGE COMPONENT ============
const HomePage = ({ 
    events, loading, viewMode, setViewMode, filterType, setFilterType, 
    isAdmin, t, language, setLanguage, setShowLogin, 
    handleDelete, openEditModal, openCreateModal, onSelectEvent 
}) => {
    
    const filteredEvents = useMemo(() => {
        if (filterType === 'all') return events;
        return events.filter(e => e.type === filterType);
    }, [filterType, events]);
 
    const filterCategories = ['all', EventTypes.WATER, EventTypes.HIKING_1, EventTypes.KIDS, EventTypes.WEEKEND, EventTypes.EXPEDITION];
 
    return (
        <>
            {/* 1. HERO SECTION */}
            <Hero 
                isAdmin={isAdmin}
                t={t}
                language={language}
                setLanguage={setLanguage}
                setShowLogin={setShowLogin}
                setViewMode={setViewMode}
            />
 
            {/* 2. MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-4 py-8 min-h-[50vh]">
                {/* Filters & View Toggle */}
                {!isAdmin && (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                            <button 
                                onClick={() => setViewMode(ViewModes.GRID)} 
                                aria-label="Сетка" 
                                className={`p-2 rounded-lg transition ${viewMode === ViewModes.GRID ? 'bg-teal-50 text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid size={20}/>
                            </button>
                            <button 
                                onClick={() => setViewMode(ViewModes.CALENDAR)} 
                                aria-label="Календарь" 
                                className={`p-2 rounded-lg transition ${viewMode === ViewModes.CALENDAR ? 'bg-teal-50 text-teal-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <CalendarDays size={20}/>
                            </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
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
 
                {/* Admin: Add Button */}
                {isAdmin && (
                    <Button 
                        onClick={openCreateModal} 
                        className="w-full mb-6 !py-4 border-2 border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 !bg-transparent !shadow-none"
                    >
                        <Plus/> {t.admin.add}
                    </Button>
                )}
 
                {/* Content Grid/Calendar */}
                {loading ? <SkeletonGrid /> : (
                    <>
                        {viewMode === ViewModes.GRID || isAdmin ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                               {filteredEvents.map((event, idx) => (
                                   <div key={event.id} className="relative group">
                                        <EventCard event={event} onSelect={onSelectEvent} index={idx} t={t} />
                                        
                                        {isAdmin && (
                                           <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition">
                                                <button 
                                                    onClick={(e)=>{e.stopPropagation(); openEditModal(event)}} 
                                                    aria-label="Редактировать" 
                                                    className="bg-white p-2 rounded-full text-blue-500 shadow-lg hover:bg-blue-50"
                                                >
                                                    <Edit size={20}/>
                                                </button>
                                                <button 
                                                    onClick={(e)=>{e.stopPropagation(); handleDelete(event.id)}} 
                                                    aria-label="Удалить" 
                                                    className="bg-white p-2 rounded-full text-red-500 shadow-lg hover:bg-red-50"
                                                >
                                                    <Trash2 size={20}/>
                                                </button>
                                           </div>
                                        )}
                                   </div>
                                ))}
                            </div>
                        ) : (
                            <CalendarView events={filteredEvents} onSelect={onSelectEvent} currentLang={language} />
                        )}
                    </>
                )}
            </main>

            {/* 3. FOOTER SECTION */}
            <Footer /> {/* <--- Добавили компонент сюда */}
        </>
    );
};
 
// ============ MAIN APP WRAPPER ============
const App = () => { 
  const { events, loading, deleteEvent, bookEvent, uploadImage, createEvent, updateEvent } = useEvents();
  const navigate = useNavigate();
  
  // States
  const [editingEvent, setEditingEvent] = useState(null); 
  const [showFormModal, setShowFormModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedEventForReg, setSelectedEventForReg] = useState(null);
  
  const [viewMode, setViewMode] = useState(ViewModes.GRID); 
  const [filterType, setFilterType] = useState('all');
  const [language, setLanguage] = useState(Languages.RU);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [regForm, setRegForm] = useState({ name: '', phone: '', tickets: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const t = translations[language] || translations.ru;
 
  // Handlers
  const handleCreateOrUpdate = async (formData) => {
      let result;
      if (editingEvent) result = await updateEvent(editingEvent.id, formData);
      else result = await createEvent(formData);
      
      if (result.error) alert(result.error.message);
      else {
          setToast({ message: editingEvent ? 'Тур обновлен' : 'Тур создан', type: 'success' });
          setShowFormModal(false);
          setEditingEvent(null);
      }
  }
 
  const handleRegister = async (e) => {
      e.preventDefault();
      if(!regForm.name || !regForm.phone) return alert(t.validation.nameRequired);
 
      setIsSubmitting(true);
      const { error } = await bookEvent({
          eventId: selectedEventForReg.id,
          formData: regForm,
          totalPrice: selectedEventForReg.price.adult * regForm.tickets
      });
      
      if(!error) {
          setToast({ message: t.messages.success, type: 'success' });
          setShowRegModal(false);
      } else {
          setToast({ message: error.message || t.messages.error, type: 'error' });
      }
      setIsSubmitting(false);
  }
 
  return (
        <div className="min-h-screen bg-[#f8fafc] font-sans">
            <Routes>
                {/* ГЛАВНАЯ СТРАНИЦА */}
                <Route path="/" element={
                    <HomePage 
                        events={events} 
                        loading={loading} 
                        viewMode={viewMode} 
                        setViewMode={setViewMode}
                        filterType={filterType} 
                        setFilterType={setFilterType} 
                        isAdmin={isAdmin}
                        t={t} 
                        language={language} 
                        setLanguage={setLanguage} 
                        setShowLogin={setShowLogin}
                        handleDelete={(id) => {
                            if(window.confirm('Удалить?')) deleteEvent(id)
                        }}
                        openEditModal={(ev) => {
                            setEditingEvent(ev); 
                            setShowFormModal(true);
                        }}
                        openCreateModal={() => {
                            setEditingEvent(null); 
                            setShowFormModal(true);
                        }}
                        onSelectEvent={(event) => navigate(`/tour/${event.id}`)} 
                    />
                } />
 
                {/* СТРАНИЦА ТУРА */}
                <Route path="/tour/:id" element={
                    <TourPage 
                        events={events} 
                        onRegister={(event) => {
                            setSelectedEventForReg(event);
                            setRegForm({name: '', phone: '', tickets: 1});
                            setShowRegModal(true);
                        }} 
                    />
                } />
            </Routes>
 
            {/* МОДАЛКИ */}
            {showLogin && (
                <LoginModal 
                    onClose={()=>setShowLogin(false)} 
                    onLogin={()=>{setShowLogin(false); setIsAdmin(true);}} 
                />
            )}
            
            {showFormModal && (
                <EventFormModal 
                   onClose={()=>{setShowFormModal(false); setEditingEvent(null);}} 
                   onSubmit={handleCreateOrUpdate} 
                   onUpload={uploadImage}
                   initialData={editingEvent}
                />
            )}
 
            {showRegModal && selectedEventForReg && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn" onClick={()=>setShowRegModal(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setShowRegModal(false)} aria-label="Закрыть" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                        <h2 className="text-xl font-bold mb-1 pr-8 text-gray-500">Запись на тур</h2>
                        <h3 className="text-2xl font-bold mb-4 font-condensed uppercase">{selectedEventForReg.title}</h3>
                        <form onSubmit={handleRegister} className="space-y-4">
                           <div><label className="text-sm font-bold text-gray-700 block mb-1">Имя</label><input value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Как к вам обращаться?"/></div>
                           <div><label className="text-sm font-bold text-gray-700 block mb-1">Телефон</label><input value={regForm.phone} onChange={e=>setRegForm({...regForm, phone: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="+373..."/></div>
                           <div><label className="text-sm font-bold text-gray-700 block mb-1">Количество мест</label><input type="number" min="1" max={selectedEventForReg.spotsLeft} value={regForm.tickets} onChange={e=>setRegForm({...regForm, tickets: +e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"/></div>
                            <Button isLoading={isSubmitting} variant="primary" className="w-full mt-2">Записаться</Button>
                        </form>
                    </div>
                </div>
            )}
 
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
  );
};
 
export default App;
