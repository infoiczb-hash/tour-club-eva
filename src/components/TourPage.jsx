import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, Calendar, Clock, User, Mountain, Footprints, 
    CheckCircle, XCircle, HelpCircle, ArrowLeft, Share2, 
    Wallet, AlertCircle 
} from 'lucide-react';
import Button from './ui/Button';

const TourPage = ({ events, onRegister }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Находим нужный тур по ID из адресной строки
    const event = events.find(e => e.id === id);

    // Скролл вверх при открытии страницы
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!event) return <div className="p-10 text-center">Тур не найден...</div>;

    // Форматирование дат
    const startDate = new Date(event.date);
    const dateStr = startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const startTime = event.time?.slice(0,5);

    // Фильтр цен (показываем только те, что > 0)
    const prices = [
        { label: 'Взрослый', value: event.price.adult },
        { label: 'Детский', value: event.price.child },
        { label: 'Семейный', value: event.price.family },
    ].filter(p => p.value > 0);

    return (
        <div className="bg-white min-h-screen pb-24 md:pb-0 font-sans">
            
            {/* === 1. HERO HEADER (ОБЛОЖКА) === */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                {/* Навигация сверху */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-20">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <ArrowLeft size={24} />
                    </button>
                    <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition">
                        <Share2 size={24} />
                    </button>
                </div>

                {/* Заголовок и Метки */}
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

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* === ЛЕВАЯ КОЛОНКА (КОНТЕНТ) === */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* 2. ИНФОГРАФИКА (Сетка) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InfoCard icon={Calendar} label="Дата старта" value={dateStr} sub={startTime} />
                        <InfoCard icon={Clock} label="Длительность" value={event.duration || '1 день'} />
                        <InfoCard icon={Footprints} label="Дистанция" value={event.distance || 'Не указана'} />
                        <InfoCard icon={Mountain} label="Сложность" value={event.difficulty} />
                        <InfoCard icon={User} label="Гид" value={event.guide || 'Команда клуба'} />
                        <InfoCard icon={MapPin} label="Место сбора" value={event.location} />
                    </div>

                    {/* Описание */}
                    <div>
                        <h2 className="text-2xl font-condensed font-bold mb-4 uppercase">О путешествии</h2>
                        <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>

                    {/* 3. ПРОГРАММА (Timeline) */}
                    {event.program && (
                        <div>
                            <h2 className="text-2xl font-condensed font-bold mb-6 uppercase">Программа тура</h2>
                            <div className="border-l-2 border-teal-100 pl-6 space-y-6 relative">
                                {/* Простое отображение текста программы. 
                                    Если в будущем сделаем JSON для программы, тут будет цикл. 
                                    Пока парсим переносы строк. */}
                                {event.program.split('\n').map((line, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-teal-100 border-2 border-teal-500"></div>
                                        <p className="text-gray-700">{line}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. МАРШРУТ, ВКЛЮЧЕНО, РАСХОДЫ */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Включено */}
                        {event.included && event.included.length > 0 && (
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <CheckCircle className="text-teal-600"/> Включено
                                </h3>
                                <ul className="space-y-3">
                                    {event.included.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Доп. расходы */}
                        {event.additionalExpenses && event.additionalExpenses.length > 0 && (
                            <div className="bg-orange-50 p-6 rounded-2xl">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
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

                    {/* 5. FAQ (Аккордеон) */}
                    {event.faq && event.faq.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-condensed font-bold mb-6 uppercase flex items-center gap-2">
                                <HelpCircle /> Частые вопросы
                            </h2>
                            <div className="space-y-2">
                                {event.faq.map((item, i) => (
                                    <details key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                        <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-gray-800 hover:bg-gray-50 transition list-none">
                                            {item.q}
                                            <span className="transition group-open:rotate-180">▼</span>
                                        </summary>
                                        <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed border-t border-transparent group-open:border-gray-100 group-open:pt-4">
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
                    <div className="sticky top-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-100/50">
                        <div className="mb-6">
                            <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Стоимость участия</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-condensed font-bold text-teal-700">{event.price.adult}₽</span>
                                {event.priceOld && <span className="text-lg text-gray-400 line-through decoration-red-400">{event.priceOld}₽</span>}
                            </div>
                        </div>

                        {/* Типы билетов */}
                        <div className="space-y-3 mb-8">
                            {prices.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">{p.label}</span>
                                    <span className="font-bold text-gray-900">{p.value}₽</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
                            <CheckCircle size={16}/>
                            Осталось {event.spotsLeft} мест из {event.spots}
                        </div>

                        <Button onClick={() => onRegister(event)} className="w-full text-lg py-4 shadow-teal-300/50">
                            Записаться
                        </Button>
                    </div>
                </div>
            </div>

            {/* === 6. STICKY FOOTER (MOBILE ONLY) === */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Цена от</p>
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

// Хелпер для карточек инфографики
const InfoCard = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <Icon className="text-teal-600 mb-2" size={24} />
        <p className="text-xs text-gray-400 font-bold uppercase mb-1">{label}</p>
        <p className="font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
);

export default TourPage;
