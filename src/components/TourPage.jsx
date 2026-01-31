import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  MapPin, Calendar, Clock, User, Mountain, Footprints, 
  CheckCircle, XCircle, ChevronDown, ArrowLeft, Share2, 
  Wallet, Navigation, Shield, Zap, Check, AlertCircle, Users
} from 'lucide-react';
import Button from './ui/Button';

// 1. ХЕЛПЕРЫ
const formatText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const formatDateRange = (start, end) => {
    if (!start) return '';
    const d1 = new Date(start);
    const d1Str = d1.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    if (!end) return d1Str;
    const d2 = new Date(end);
    const d2Str = d2.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return d1.getTime() === d2.getTime() ? d1Str : `${d1Str} — ${d2Str}`;
};

const TourPage = ({ events, onRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('about');
    
    // Находим тур (учитываем, что id может быть строкой или числом)
    const event = events.find(e => String(e.id) === String(id));

    // Скролл наверх
    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    // Логика скролла и активного таба
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['about', 'program', 'finance', 'faq'];
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top >= 0 && rect.top <= 300;
                }
                return false;
            });
            if (current) setActiveTab(current);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset - 140; // Чуть больше отступ из-за стики хедера
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveTab(id);
        }
    };

    if (!event) return <div className="p-20 text-center text-slate-500">Тур не найден... 😔</div>;

    const dateString = formatDateRange(event.date, event.end_date);
    
    // SEO Схема
    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.title,
        "startDate": event.date,
        "endDate": event.end_date || event.date,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": event.location,
            "address": { "@type": "PostalAddress", "addressLocality": event.location }
        },
        "image": [event.image],
        "description": event.subtitle || event.description,
        "offers": {
            "@type": "Offer",
            "price": event.price?.adult,
            "priceCurrency": "RUB", // Или MDL, если нужно
            "availability": event.spotsLeft > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            "url": window.location.href
        }
    };

    return (
        <div className="bg-white min-h-screen pb-24 md:pb-10 font-sans text-slate-800">
            {/* SEO */}
            <Helmet>
                <title>{event.title} | Турклуб Эва</title>
                <meta name="description" content={event.subtitle || event.description?.slice(0, 160)} />
                <meta property="og:image" content={event.image} />
                <script type="application/ld+json">{JSON.stringify(eventSchema)}</script>
            </Helmet>

            {/* 1. HERO SECTION (Parallax Style) */}
            <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden">
                <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90" />
                
                {/* Навигация сверху */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all border border-white/10">
                        <ArrowLeft size={20} />
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) navigator.share({ title: event.title, url: window.location.href });
                            else alert('Ссылка скопирована!');
                        }} 
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all border border-white/10"
                    >
                        <Share2 size={20} />
                    </button>
                </div>

                {/* Контент Hero */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 max-w-7xl mx-auto">
                    <div className="flex gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-teal-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-teal-500/30">
                           {event.type}
                        </span>
                        {event.label && (
                           <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest border border-white/20">
                              {event.label}
                           </span>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-condensed font-bold text-white uppercase leading-none mb-3 drop-shadow-lg">
                        {event.title}
                    </h1>
                    {event.subtitle && (
                        <p className="text-lg md:text-xl text-slate-200 font-medium max-w-2xl leading-snug">
                            {event.subtitle}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-6 text-slate-300 font-medium">
                        <MapPin size={20} className="text-teal-400" /> 
                        {event.location}
                    </div>
                </div>
            </div>

            {/* 2. STICKY NAV (Меню якорей) */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto hide-scrollbar">
                    <div className="flex space-x-8 min-w-max">
                        {[
                            { id: 'about', label: 'Обзор' },
                            { id: 'program', label: 'Программа' },
                            { id: 'finance', label: 'Условия' },
                            { id: 'faq', label: 'Вопросы' },
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                                    activeTab === item.id 
                                    ? 'border-teal-600 text-teal-700' 
                                    : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. MAIN CONTENT (Grid Layout) */}
            <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* ЛЕВАЯ КОЛОНКА (Контент) */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* ABOUT: Bento Grid Характеристики */}
                    <div id="about" className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <InfoBox icon={Calendar} label="Дата" value={dateString} />
                           <InfoBox icon={Mountain} label="Сложность" value={event.difficulty || 'Средняя'} />
                           <InfoBox icon={Footprints} label="Дистанция" value={event.distance || '-'} />
                           <InfoBox icon={Users} label="Группа" value={`до ${event.spots || 20}`} />
                           
                           {/* Место сбора: Если есть отдельное место сбора - показываем его, иначе локацию */}
                           <div className="col-span-2 md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                   <Navigation size={20} />
                               </div>
                               <div>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Место сбора</p>
                                   <p className="text-sm font-bold text-slate-900 leading-tight">
                                       {event.meeting_point || event.location}
                                   </p>
                                   <p className="text-xs text-slate-500 mt-0.5">{event.time || '08:00'}</p>
                               </div>
                           </div>
                        </div>

                        {/* Описание */}
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                            <h3 className="font-condensed font-bold text-2xl uppercase text-slate-900 mb-4 flex items-center gap-2">
                               <Shield className="w-6 h-6 text-teal-600" /> О приключении
                            </h3>
                            <div className="whitespace-pre-line text-lg">
                                {formatText(event.description)}
                            </div>
                        </div>
                    </div>

                    {/* PROGRAM: Timeline */}
                    {event.program && (
                        <div id="program" className="scroll-mt-28">
                           <h3 className="font-condensed font-bold text-2xl uppercase text-slate-900 mb-8 flex items-center gap-2">
                              <Clock className="w-6 h-6 text-teal-600" /> Программа тура
                           </h3>
                           <div className="border-l-2 border-teal-100 ml-3 space-y-10 pl-8 relative">
                              {event.program.split('\n').filter(l => l.trim()).map((line, idx) => (
                                 <div key={idx} className="relative group">
                                    <span className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-white border-4 border-teal-100 group-hover:border-teal-500 transition-colors" />
                                    <p className="text-slate-700 text-lg leading-relaxed">{formatText(line)}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                    )}

                    {/* FINANCE: Включено / Не включено */}
                    <div id="finance" className="scroll-mt-28 grid md:grid-cols-2 gap-6">
                        {event.included && (
                            <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100">
                                <h4 className="font-bold text-emerald-900 mb-5 flex items-center gap-2 text-lg">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" /> В стоимость входит
                                </h4>
                                <ul className="space-y-4">
                                    {event.included.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                            {formatText(item)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {event.additionalExpenses && (
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                                    <Wallet className="w-5 h-5 text-orange-500" /> Доп. расходы
                                </h4>
                                <ul className="space-y-4">
                                    {event.additionalExpenses.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-1.5 shrink-0" />
                                            {formatText(item)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* FAQ: Аккордеон */}
                    {event.faq && event.faq.length > 0 && (
                        <div id="faq" className="scroll-mt-28">
                            <h3 className="font-condensed font-bold text-2xl uppercase text-slate-900 mb-6 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-teal-600" /> Вопрос - Ответ
                            </h3>
                            <div className="space-y-4">
                                {event.faq.map((item, i) => (
                                    <details key={i} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden open:shadow-lg open:border-teal-100 transition-all duration-300">
                                        <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-slate-800 list-none hover:bg-slate-50 transition">
                                            <span>{item.q}</span>
                                            <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="px-5 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                                            {item.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ПРАВАЯ КОЛОНКА (Sticky Booking - Только Десктоп) */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Карточка брони */}
                        <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100">
                            <div className="text-center mb-6">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Стоимость участия</span>
                                <div className="flex items-center justify-center gap-3 mt-1">
                                    <span className="text-5xl font-condensed font-bold text-slate-900">{event.price?.adult}</span>
                                    <span className="text-xl font-medium text-slate-400">₽</span>
                                </div>
                                {event.priceOld && (
                                    <span className="text-sm text-slate-400 line-through decoration-rose-400 block mt-1">
                                        {event.priceOld} ₽
                                    </span>
                                )}
                            </div>

                            {/* Цены для детей/семьи */}
                            {(event.price?.child > 0 || event.price?.family > 0) && (
                                <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm space-y-2 border border-slate-100">
                                    {event.price.child > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Детский:</span>
                                            <span className="font-bold text-slate-900">{event.price.child} ₽</span>
                                        </div>
                                    )}
                                    {event.price.family > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Семейный:</span>
                                            <span className="font-bold text-slate-900">{event.price.family} ₽</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Индикатор мест */}
                            <div className="mb-6">
                                {event.spotsLeft > 0 ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 rounded-lg text-sm font-bold">
                                        <CheckCircle size={16} /> Осталось {event.spotsLeft} мест
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-rose-600 bg-rose-50 py-2 rounded-lg text-sm font-bold">
                                        <XCircle size={16} /> Мест нет
                                    </div>
                                )}
                            </div>

                            <Button 
                                onClick={() => onRegister(event)} 
                                variant="primary" 
                                className="w-full h-14 text-lg shadow-xl shadow-teal-600/20 group hover:scale-[1.02]"
                            >
                                Записаться
                                <Zap className="w-5 h-5 ml-2 group-hover:fill-current transition-colors" />
                            </Button>
                            <p className="text-center text-xs text-slate-400 mt-4">
                                Бронирование без предоплаты
                            </p>
                        </div>

                        {/* Блок Гида */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-teal-400 border-2 border-slate-600 shrink-0">
                               E
                           </div>
                           <div className="relative z-10">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Организатор</p>
                              <p className="font-bold text-lg leading-none mt-1">Турклуб ЭВА</p>
                           </div>
                           <div className="absolute -right-4 -bottom-10 w-24 h-24 bg-teal-500/20 rounded-full blur-xl" />
                        </div>
                    </div>
                </div>

            </div>

            {/* 4. MOBILE STICKY BOTTOM BAR (Только мобилка) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:hidden z-50 flex items-center justify-between shadow-[0_-5px_30px_rgba(0,0,0,0.1)] safe-area-pb">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Цена за место</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-condensed font-bold text-slate-900">{event.price?.adult}₽</span>
                        {event.priceOld && <span className="text-xs text-slate-400 line-through">{event.priceOld}</span>}
                    </div>
                </div>
                <Button onClick={() => onRegister(event)} className="px-8 py-3 h-12 shadow-lg shadow-teal-500/20">
                    Записаться
                </Button>
            </div>

        </div>
    );
};

// Компонент Bento Box для характеристик
const InfoBox = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start h-full hover:border-teal-200 hover:shadow-md transition-all">
            <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mb-3">
                <Icon size={18} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">{label}</p>
            <p className="font-bold text-sm text-slate-900 leading-tight">{value}</p>
        </div>
    );
};

export default TourPage;
