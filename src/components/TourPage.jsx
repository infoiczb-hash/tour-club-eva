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
