import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, Calendar, Clock, User, Mountain, Footprints, 
    CheckCircle, XCircle, HelpCircle, ArrowLeft, Share2, 
    Wallet, Navigation, Info, ChevronDown
} from 'lucide-react';
import Button from './ui/Button';

const TourPage = ({ events, onRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('about');
    
    const event = events.find(e => e.id === id);

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    // Скролл-шпион для меню
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

    if (!event) return <div className="p-10 text-center">Тур не найден...</div>;

    // Даты
    const startDate = new Date(event.date);
    const dateStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const startTime = event.time?.slice(0,5);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveTab(id);
        }
    };

    return (
        <div className="bg-[#F8FAFC] min-h-screen pb-24 md:pb-0">
            
            {/* === 1. HERO (ОБЛОЖКА) === */}
            <div className="relative h-[50vh] md:h-[65vh] w-full overflow-hidden group">
                <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                
                {/* Навигация */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <ArrowLeft size={24} />
                    </button>
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <Share2 size={24} />
                    </button>
                </div>

                {/* Заголовок */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 md:pb-12 max-w-6xl mx-auto text-white">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-teal-600 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm">
                            {event.type}
                        </span>
                        {event.label && (
                            <span className="bg-pink-500 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm">
                                {event.label}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-condensed font-bold uppercase leading-tight mb-2 drop-shadow-lg">
                        {event.title}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-200 text-lg">
                        <MapPin size={20} className="text-teal-400"/> 
                        {event.location} {/* Локация - Куда едем */}
                    </div>
                </div>
            </div>

            {/* === 2. STICKY MENU === */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm overflow-x-auto hide-scrollbar">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex space-x-6 text-sm font-bold uppercase tracking-wider">
                        {[
                            { id: 'about', label: 'Детали' },
                            { id: 'program', label: 'Программа' },
                            { id: 'finance', label: 'Включено' },
                            { id: 'faq', label: 'FAQ' },
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`py-4 border-b-2 transition whitespace-nowrap ${
                                    activeTab === item.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* === ЛЕВАЯ КОЛОНКА === */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* ИНФОГРАФИКА (Скрываем пустые поля!) */}
                    <div id="about" className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <InfoBox icon={Calendar} label="Старт" value={dateStr} sub={startTime} />
                        <InfoBox icon={Clock} label="Длительность" value={event.duration} />
                        {event.distance && <InfoBox icon={Footprints} label="Дистанция" value={event.distance} />}
                        <InfoBox icon={Mountain} label="Сложность" value={event.difficulty} />
                        <InfoBox icon={User} label="Гид" value={event.guide} />
                        
                        {/* Разделяем: Локация (Куда) vs Место сбора (Где) */}
                        {event.meeting_point && (
                             <InfoBox icon={Navigation} label="Место сбора" value={event.meeting_point} />
                        )}
                        {!event.meeting_point && (
                             <InfoBox icon={Navigation} label="Место сбора" value={event.location} />
                        )}
                    </div>

                    {/* ОПИСАНИЕ */}
                    <div className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-line">
                        <h2 className="text-2xl font-condensed font-bold mb-4 uppercase text-black">О путешествии</h2>
                        {event.description}
                    </div>

                    {/* ПРОГРАММА (TIMELINE) - Полная реконструкция */}
                    {event.program && (
                        <div id="program" className="scroll-mt-24">
                            <h2 className="text-2xl font-condensed font-bold mb-6 uppercase text-black">Программа тура</h2>
                            <div className="border-l-2 border-teal-100 ml-3 space-y-8 pb-2">
                                {event.program.split('\n').filter(line => line.trim() !== '').map((line, i) => (
                                    <div key={i} className="relative pl-8 group">
                                        {/* Точка на линии */}
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-2 border-teal-500 rounded-full group-hover:bg-teal-500 transition-colors"></div>
                                        
                                        {/* Текст программы */}
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                             <p className="text-gray-800 font-medium">{line}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ФИНАНСЫ (КОМПАКТНЫЙ БЛОК, как на скрине 3) */}
                    <div id="finance" className="scroll-mt-24 grid md:grid-cols-2 gap-6">
                        {/* Зеленый блок: Включено */}
                        {event.included && event.included.length > 0 && (
                            <div className="bg-[#ECFDF5] rounded-2xl p-6 border border-[#D1FAE5]">
                                <h3 className="flex items-center gap-2 font-bold text-lg text-[#047857] mb-4">
                                    <CheckCircle size={20} className="fill-[#10B981] text-white"/> Включено
                                </h3>
                                <ul className="space-y-3">
                                    {event.included.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                                            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full mt-1.5 shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Оранжевый блок: Расходы */}
                        {event.additionalExpenses && event.additionalExpenses.length > 0 && (
                            <div className="bg-[#FFF7ED] rounded-2xl p-6 border border-[#FFEDD5]">
                                <h3 className="flex items-center gap-2 font-bold text-lg text-[#C2410C] mb-4">
                                    <Wallet size={20} className="text-[#F97316]"/> Доп. расходы
                                </h3>
                                <ul className="space-y-3">
                                    {event.additionalExpenses.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                                            <XCircle size={16} className="text-[#F97316] mt-0.5 shrink-0"/>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* FAQ (АККОРДЕОН) */}
                    {event.faq && event.faq.length > 0 && (
                        <div id="faq" className="scroll-mt-24">
                            <h2 className="text-2xl font-condensed font-bold mb-6 uppercase text-black">Вопрос - Ответ</h2>
                            <div className="space-y-3">
                                {event.faq.map((item, i) => (
                                    <details key={i} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-gray-900 list-none hover:bg-gray-50 transition">
                                            <span>{item.q}</span>
                                            <ChevronDown className="text-gray-400 transition-transform duration-300 group-open:rotate-180" size={20}/>
                                        </summary>
                                        <div className="px-5 pb-5 pt-0 text-gray-600 border-t border-transparent group-open:border-gray-100 group-open:pt-4">
                                            {item.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* === ПРАВАЯ КОЛОНКА (STICKY) === */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-100/50">
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Цена за место</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                                {event.priceOld && <span className="text-lg text-gray-400 line-through decoration-red-400">{event.priceOld}₽</span>}
                            </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            {event.spotsLeft > 0 ? (
                                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-200">
                                    <CheckCircle size={18}/>
                                    Осталось мест: {event.spotsLeft}
                                </div>
                            ) : (
                                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-200">
                                    <XCircle size={18}/>
                                    Мест нет
                                </div>
                            )}
                        </div>

                        <Button onClick={() => onRegister(event)} className="w-full text-lg py-4 shadow-teal-300/50 hover:-translate-y-1">
                            Записаться
                        </Button>
                        <p className="text-center text-xs text-gray-400 mt-4">Бронирование без предоплаты</p>
                    </div>
                </div>
            </div>

            {/* MOBILE FOOTER */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Цена</p>
                    <span className="text-2xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                </div>
                <Button onClick={() => onRegister(event)} className="px-8 py-3">
                    Записаться
                </Button>
            </div>
        </div>
    );
};

// Компонент одной карточки (скрывается если нет value)
const InfoBox = ({ icon: Icon, label, value, sub }) => {
    if (!value) return null; // СКРЫВАЕМ ЕСЛИ ПУСТО
    return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-start h-full">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg mb-2">
                <Icon size={18} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{label}</p>
            <p className="font-bold text-sm text-gray-900 leading-tight">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    );
};

export default TourPage;
