import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, Calendar, Clock, User, Mountain, Footprints, 
    CheckCircle, XCircle, HelpCircle, ArrowLeft, Share2, 
    Wallet, AlignJustify, Info
} from 'lucide-react';
import Button from './ui/Button';

const TourPage = ({ events, onRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('about');
    
    // Находим тур
    const event = events.find(e => e.id === id);

    // Скролл вверх при открытии
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Следим за скроллом для подсветки меню
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['about', 'program', 'included', 'faq'];
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

    if (!event) return <div className="p-10 text-center text-gray-500">Тур не найден...</div>;

    // Форматирование
    const startDate = new Date(event.date);
    const dateStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const startTime = event.time?.slice(0,5);
    
    // Цены (только те, что > 0)
    const prices = [
        { label: 'Взрослый', value: event.price.adult },
        { label: 'Детский', value: event.price.child },
        { label: 'Семейный', value: event.price.family },
    ].filter(p => p.value > 0);

    // Функция плавной прокрутки
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            // Отступ сверху для учета липкого меню (80px)
            const y = element.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveTab(id);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-24 md:pb-0 font-sans">
            
            {/* === 1. HERO HEADER (ОБЛОЖКА) === */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <img 
                    src={event.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                {/* Навигация (Назад) */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-20">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <ArrowLeft size={24} />
                    </button>
                    <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <Share2 size={24} />
                    </button>
                </div>

                {/* Заголовок */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 md:pb-12 max-w-7xl mx-auto text-white">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-teal-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg">
                            {event.type}
                        </span>
                        {event.label && (
                            <span className="bg-[#D946EF] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg">
                                {event.label}
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-condensed font-bold uppercase leading-tight mb-2 shadow-black drop-shadow-lg">
                        {event.title}
                    </h1>
                    <div className="flex items-center gap-2 text-white/90 font-medium text-lg">
                        <MapPin size={20} className="text-teal-400"/> {event.location}
                    </div>
                </div>
            </div>

            {/* === 2. STICKY NAVIGATION (ЛИПКОЕ МЕНЮ КАК НА SICRO.MD) === */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm overflow-x-auto hide-scrollbar">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-8 text-sm font-bold uppercase tracking-wider">
                        {[
                            { id: 'about', label: 'Обзор', icon: Info },
                            { id: 'program', label: 'Программа', icon: AlignJustify },
                            { id: 'included', label: 'Включено', icon: CheckCircle },
                            { id: 'faq', label: 'FAQ', icon: HelpCircle },
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`py-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                                    activeTab === item.id 
                                    ? 'border-teal-600 text-teal-700' 
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* === ЛЕВАЯ КОЛОНКА (КОНТЕНТ) === */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Сетка инфографики */}
                    <div id="about" className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InfoCard icon={Calendar} label="Старт" value={dateStr} sub={startTime} />
                        <InfoCard icon={Clock} label="Длительность" value={event.duration || '1 день'} />
                        <InfoCard icon={Footprints} label="Дистанция" value={event.distance || 'Н/Д'} />
                        <InfoCard icon={Mountain} label="Сложность" value={event.difficulty} />
                        <InfoCard icon={User} label="Гид" value={event.guide || 'Команда'} />
                        <InfoCard icon={MapPin} label="Сбор" value={event.location} />
                    </div>

                    {/* Описание */}
                    <div className="prose prose-lg text-gray-600">
                        <h2 className="text-2xl font-condensed font-bold mb-4 uppercase text-gray-900">О путешествии</h2>
                        <p className="leading-relaxed whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>

                    {/* ПРОГРАММА (TIMELINE) */}
                    {event.program && (
                        <div id="program" className="scroll-mt-24">
                            <h2 className="text-2xl font-condensed font-bold mb-6 uppercase">Программа тура</h2>
                            <div className="space-y-6">
                                {/* Парсим программу по строкам */}
                                {event.program.split('\n').map((line, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        {/* Линия времени */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm border-2 border-teal-500 z-10">
                                                {i + 1}
                                            </div>
                                            {i !== event.program.split('\n').length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 group-hover:bg-teal-200 transition-colors my-1"></div>
                                            )}
                                        </div>
                                        {/* Контент */}
                                        <div className="pb-4 pt-1">
                                            <p className="text-gray-800 font-medium leading-relaxed">{line}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ВКЛЮЧЕНО / РАСХОДЫ */}
                    <div id="included" className="grid md:grid-cols-2 gap-8 scroll-mt-24">
                        {/* Включено */}
                        {event.included && event.included.length > 0 && (
                            <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800">
                                    <CheckCircle className="text-green-600"/> Включено
                                </h3>
                                <ul className="space-y-3">
                                    {event.included.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Доп. расходы */}
                        {event.additionalExpenses && event.additionalExpenses.length > 0 && (
                            <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-800">
                                    <Wallet className="text-orange-500"/> Доп. расходы
                                </h3>
                                <ul className="space-y-3">
                                    {event.additionalExpenses.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                            <XCircle size={16} className="text-orange-400 mt-0.5 shrink-0"/>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* FAQ */}
                    {event.faq && event.faq.length > 0 && (
                        <div id="faq" className="scroll-mt-24">
                            <h2 className="text-2xl font-condensed font-bold mb-6 uppercase flex items-center gap-2">
                                <HelpCircle /> Частые вопросы
                            </h2>
                            <div className="space-y-3">
                                {event.faq.map((item, i) => (
                                    <details key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-md">
                                        <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-gray-800 hover:bg-gray-50 transition list-none">
                                            <span className="flex items-center gap-3">
                                                <span className="text-teal-500 font-serif italic text-lg">Q:</span>
                                                {item.q}
                                            </span>
                                            <span className="transition-transform duration-300 group-open:rotate-180 text-gray-400">▼</span>
                                        </summary>
                                        <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed border-t border-transparent group-open:border-gray-100 group-open:pt-4 ml-8">
                                            {item.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* === ПРАВАЯ КОЛОНКА (STICKY DESKTOP) === */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-100/50">
                        <div className="mb-6">
                            <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Стоимость</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                                {event.priceOld && <span className="text-lg text-gray-400 line-through decoration-red-400">{event.priceOld}₽</span>}
                            </div>
                        </div>

                        {/* Список цен */}
                        <div className="space-y-3 mb-8">
                            {prices.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 border-dashed last:border-0">
                                    <span className="text-gray-600 font-medium">{p.label}</span>
                                    <span className="font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded">{p.value}₽</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2 border border-green-100">
                            <CheckCircle size={16}/>
                            Осталось {event.spotsLeft} мест
                        </div>

                        <Button onClick={() => onRegister(event)} className="w-full text-lg py-4 shadow-teal-300/50 transform hover:-translate-y-1 transition-transform">
                            Записаться сейчас
                        </Button>
                        <p className="text-center text-xs text-gray-400 mt-3">Бронирование без предоплаты</p>
                    </div>
                </div>
            </div>

            {/* === STICKY FOOTER (MOBILE ONLY) === */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Всего от</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                        {event.priceOld && <span className="text-xs text-gray-400 line-through decoration-red-400">{event.priceOld}₽</span>}
                    </div>
                </div>
                <Button onClick={() => onRegister(event)} className="px-8 py-3 shadow-teal-300/50">
                    Записаться
                </Button>
            </div>

        </div>
    );
};

// Компонент инфо-карточки
const InfoCard = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-teal-200 transition-colors group">
        <Icon className="text-teal-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">{label}</p>
        <p className="font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
);

export default TourPage;
