import React, { useEffect, useState } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // ✅ SEO
import { 
    MapPin, Calendar, Clock, User, Mountain, Footprints, 
    CheckCircle, XCircle, ChevronDown, ArrowLeft, Share2, 
    Wallet, Navigation
} from 'lucide-react';
import Button from './ui/Button';

const TourPage = ({ events, onRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('about');
    
    const event = events.find(e => e.id === id);

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

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

    const startDate = new Date(event.date);
    const dateStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const startTime = event.time?.slice(0,5);

    // Функция скролла
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveTab(id);
        }
    };

    // Функция для жирного текста
    const formatText = (text) => {
        if (!text) return null;
        return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // ✅ ГЕНЕРАЦИЯ SCHEMA.ORG (Для Google Events)
    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.title,
        "startDate": `${event.date}T${event.time}`,
        "endDate": event.end_date ? `${event.end_date}T${event.end_time || '18:00'}` : undefined,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": event.location,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": event.location // Можно уточнить город, если есть
            }
        },
        "image": [event.image],
        "description": event.subtitle || event.description,
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "price": event.price.adult,
            "priceCurrency": "RUB", // Или MDL
            "availability": event.spotsLeft > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            "validFrom": new Date().toISOString()
        },
        "organizer": {
            "@type": "Organization",
            "name": "Турклуб Эва",
            "url": "https://tour-club-eva.vercel.app" // Твой домен
        }
    };

    return (
        <div className="bg-[#F8FAFC] min-h-screen pb-24 md:pb-0 font-onest">
            
            {/* ✅ SEO META TAGS */}
            <Helmet>
                <title>{event.title} | Турклуб Эва</title>
                <meta name="description" content={event.subtitle || event.description?.slice(0, 160)} />
                
                {/* Open Graph / Facebook / Telegram */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={event.title} />
                <meta property="og:description" content={event.subtitle || "Присоединяйтесь к нашему путешествию!"} />
                <meta property="og:image" content={event.image} />
                <meta property="og:url" content={window.location.href} />
                
                {/* Structured Data (JSON-LD) */}
                <script type="application/ld+json">
                    {JSON.stringify(eventSchema)}
                </script>
            </Helmet>

            {/* HERO */}
            <div className="relative h-[50vh] md:h-[65vh] w-full overflow-hidden group">
                <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                
                {/* Кнопки навигации */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <ArrowLeft size={24} />
                    </button>
                    {/* Кнопка "Поделиться" с Web Share API */}
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: event.title,
                                    text: event.subtitle,
                                    url: window.location.href,
                                });
                            } else {
                                alert('Ссылка скопирована!'); // Фоллбэк
                            }
                        }} 
                        className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition"
                    >
                        <Share2 size={24} />
                    </button>
                </div>

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
                    
                    <h1 className="text-3xl md:text-5xl font-condensed font-bold uppercase leading-tight mb-2 drop-shadow-lg break-words">
                        {event.title}
                    </h1>
                    
                    {event.subtitle && (
                        <p className="text-lg md:text-xl text-white/90 font-light mb-4 max-w-2xl leading-snug hidden md:block">
                            {event.subtitle}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-gray-200 text-base">
                        <MapPin size={20} className="text-teal-400 shrink-0"/> 
                        <span className="truncate">{event.location}</span>
                    </div>
                </div>
            </div>

            {/* STICKY MENU */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm overflow-x-auto hide-scrollbar">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex space-x-8 text-[14px] font-bold uppercase tracking-wider min-w-max">
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

            <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* ЛЕВАЯ КОЛОНКА (Контент) */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* ИНФОГРАФИКА (Адаптивная сетка) */}
                    <div id="about" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <InfoBox icon={Calendar} label="Старт" value={dateStr} sub={startTime} />
                        <InfoBox icon={Clock} label="Длительность" value={event.duration} />
                        {event.distance && <InfoBox icon={Footprints} label="Дистанция" value={event.distance} />}
                        <InfoBox icon={Mountain} label="Сложность" value={event.difficulty} />
                        <InfoBox icon={User} label="Гид" value={event.guide} />
                        
                        {event.meeting_point && (
                             <InfoBox icon={Navigation} label="Место сбора" value={event.meeting_point} />
                        )}
                        {!event.meeting_point && (
                             <InfoBox icon={Navigation} label="Место сбора" value={event.location} />
                        )}
                    </div>

                    {/* ОПИСАНИЕ */}
                    <div className="text-[14px] md:text-[16px] text-gray-700 leading-relaxed whitespace-pre-line">
                        <h2 className="text-[20px] md:text-[22px] font-condensed font-bold mb-4 uppercase text-black">О путешествии</h2>
                        {/* Показываем подзаголовок на мобильных здесь, раз скрыли в шапке */}
                        {event.subtitle && <p className="font-bold mb-4 md:hidden">{event.subtitle}</p>}
                        {formatText(event.description)}
                    </div>

                    {/* ПРОГРАММА */}
                    {event.program && (
                        <div id="program" className="scroll-mt-24">
                            <h2 className="text-[20px] md:text-[22px] font-condensed font-bold mb-8 uppercase text-black">Программа тура</h2>
                            <div className="space-y-0">
                                {event.program.split('\n').filter(line => line.trim() !== '').map((line, i) => (
                                    <div key={i} className="flex gap-4 relative pb-8 last:pb-0">
                                        {/* Линия (скрываем на последнем элементе) */}
                                        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-teal-100 last:hidden"></div>
                                        
                                        {/* Кружок */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-sm z-10">
                                            {i + 1}
                                        </div>
                                        
                                        {/* Текст */}
                                        <div className="pt-1">
                                             <p className="text-[14px] md:text-[16px] text-gray-800 font-medium leading-snug">
                                                {formatText(line)}
                                             </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ФИНАНСЫ */}
                    <div id="finance" className="scroll-mt-24 grid md:grid-cols-2 gap-6">
                        {event.included && event.included.length > 0 && (
                            <div className="bg-[#ECFDF5] rounded-2xl p-6 border border-[#D1FAE5]">
                                <h3 className="flex items-center gap-2 font-bold text-[18px] text-[#047857] mb-4">
                                    <CheckCircle size={20} className="fill-[#10B981] text-white"/> Включено
                                </h3>
                                <ul className="space-y-3">
                                    {event.included.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[14px] font-medium text-gray-700">
                                            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full mt-1.5 shrink-0"></span>
                                            {formatText(item)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {event.additionalExpenses && event.additionalExpenses.length > 0 && (
                            <div className="bg-[#FFF7ED] rounded-2xl p-6 border border-[#FFEDD5]">
                                <h3 className="flex items-center gap-2 font-bold text-[18px] text-[#C2410C] mb-4">
                                    <Wallet size={20} className="text-[#F97316]"/> Доп. расходы
                                </h3>
                                <ul className="space-y-3">
                                    {event.additionalExpenses.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[14px] font-medium text-gray-700">
                                            <XCircle size={16} className="text-[#F97316] mt-0.5 shrink-0"/>
                                            {formatText(item)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* FAQ */}
                    {event.faq && event.faq.length > 0 && (
                        <div id="faq" className="scroll-mt-24">
                            <h2 className="text-[20px] md:text-[22px] font-condensed font-bold mb-6 uppercase text-black">Вопрос - Ответ</h2>
                            <div className="space-y-3">
                                {event.faq.map((item, i) => (
                                    <details key={i} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <summary className="flex cursor-pointer items-center justify-between p-4 md:p-5 font-bold text-gray-900 list-none hover:bg-gray-50 transition text-[15px] md:text-[16px]">
                                            <span>{formatText(item.q)}</span>
                                            <ChevronDown className="text-gray-400 transition-transform duration-300 group-open:rotate-180 shrink-0 ml-2" size={20}/>
                                        </summary>
                                        <div className="px-5 pb-5 pt-0 text-gray-600 text-[14px] border-t border-transparent group-open:border-gray-100 group-open:pt-4 leading-relaxed">
                                            {formatText(item.a)}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ПРАВАЯ КОЛОНКА (Desktop Sticky) */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-100/50">
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Цена за место</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                                {event.priceOld && <span className="text-lg text-gray-400 line-through decoration-red-400">{event.priceOld}₽</span>}
                            </div>
                        </div>
                        
                        {(event.price.child > 0 || event.price.family > 0) && (
                            <div className="mb-6 space-y-2 text-sm text-gray-600">
                                {event.price.child > 0 && (
                                    <div className="flex justify-between">
                                        <span>Детский:</span> <span className="font-bold text-gray-900">{event.price.child}₽</span>
                                    </div>
                                )}
                                {event.price.family > 0 && (
                                    <div className="flex justify-between">
                                        <span>Семейный:</span> <span className="font-bold text-gray-900">{event.price.family}₽</span>
                                    </div>
                                )}
                            </div>
                        )}

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

            {/* MOBILE FOOTER (Фиксированный низ) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)] safe-area-pb">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Всего от</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                        {event.priceOld && <span className="text-xs text-gray-400 line-through decoration-red-400">{event.priceOld}₽</span>}
                    </div>
                </div>
                <Button onClick={() => onRegister(event)} className="px-8 py-3 shadow-lg shadow-teal-500/30">
                    Записаться
                </Button>
            </div>
        </div>
    );
};

const InfoBox = ({ icon: Icon, label, value, sub }) => {
    if (!value) return null;
    return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-start h-full hover:border-teal-200 transition">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg mb-2">
                <Icon size={18} />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5 tracking-wider">{label}</p>
            <p className="font-bold text-[13px] md:text-[14px] text-gray-900 leading-tight">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    );
};

export default TourPage;
