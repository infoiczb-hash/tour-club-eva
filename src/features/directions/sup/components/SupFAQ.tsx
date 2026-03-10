'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion, MessageCircle, Sparkles, Map } from 'lucide-react';
import Link from 'next/link';
import { useModalStore } from '@/shared/store/useModalStore';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 1. ДАННЫЕ FAQ (Адаптировано под SUP)
const FAQ_DATA = [
    { 
        id: 1,
        q: "Я упаду в воду?", 
        a: "Вероятность очень мала. Наши Touring-доски очень широкие (больше 80 см). В 99% случаев люди падают, только если дурачатся. Если боитесь на старте — можно плыть сидя или на коленях, это тоже очень комфортно." 
    },
    { 
        id: 2,
        q: "Можно ли брать с собой детей?", 
        a: "Да! Дети до 9 лет плавают на одной доске с родителем (бесплатно, выдаем детский спасжилет). Подростки старше 10 лет могут взять отдельную доску, если они уверенно держатся на воде и слушаются гида." 
    },
    { 
        id: 3,
        q: "А если я совершенно не умею плавать?", 
        a: "Вы будете в надежном сертифицированном спасательном жилете. Он держит на воде человека весом до 120 кг. Главное — внимательно слушать инструкции гида и не снимать жилет до самого выхода на берег." 
    },
    { 
        id: 4,
        q: "В чем приходить на сплав?", 
        a: "Одевайтесь по погоде (шорты и майка или легкие штаны и рашгард). Обязательно возьмите головной убор, солнцезащитный крем и очки на шнурке. Также рекомендуем взять сменный сухой комплект одежды — вы оставите его в машине на финише." 
    }
];

export default function SupFAQ() {
    const [openId, setOpenId] = useState<number | null>(null);
    const openContactModal = useModalStore((state) => state.openContactModal);		
    const toggleAccordion = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                
                {/* === БЛОК 1: FAQ === */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center mb-12"
                >
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 mb-6 shadow-xl">
                        <MessageCircleQuestion className="text-teal-500" size={28} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                        Вопросы и <span className="text-teal-500">Ответы</span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
                        Собрали самое важное для тех, кто планирует выйти на воду впервые.
                    </p>
                </motion.div>

                {/* СПИСОК АККОРДЕОНОВ */}
                <div className="space-y-3 md:space-y-4 mb-24">
                    {FAQ_DATA.map((item, index) => {
                        const isOpen = openId === item.id;
                        return (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-20px" }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                                className={cn(
                                    "bg-slate-900/60 border rounded-2xl overflow-hidden transition-colors duration-300",
                                    isOpen ? "border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.05)]" : "border-white/5 hover:border-teal-500/20 hover:bg-slate-900"
                                )}
                            >
                                <button 
                                    onClick={() => toggleAccordion(item.id)}
                                    className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
                                >
                                    <h3 className={cn(
                                        "text-base md:text-lg font-bold pr-6 transition-colors duration-300",
                                        isOpen ? "text-teal-400" : "text-white group-hover:text-teal-200"
                                    )}>
                                        {item.q}
                                    </h3>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                            isOpen ? "bg-teal-500/10 border-teal-500/30" : "bg-slate-800 border-transparent group-hover:bg-slate-700"
                                        )}
                                    >
                                        <ChevronDown size={18} className={isOpen ? "text-teal-400" : "text-slate-400"} />
                                    </motion.div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        >
                                            <div className="p-5 md:p-6 pt-0 text-slate-400 text-sm md:text-base leading-relaxed font-medium border-t border-white/5 mt-2">
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* === БЛОК 2: ФИНАЛЬНЫЙ CTA (Замыкающий экран) === */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-teal-900/40 via-slate-900 to-[#020617] border border-teal-500/20 overflow-hidden text-center flex flex-col items-center shadow-2xl"
                >
                    {/* Декоративные свечения */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500/10 md:blur-[100px] rounded-full pointer-events-none" />
                    
                    {/* Иконка */}
                    <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-8 relative z-10">
                        <Sparkles size={32} strokeWidth={1.5} />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6 relative z-10">
                        Готовы встать <span className="text-teal-500">на доску?</span>
                    </h2>
                    <p className="text-base md:text-lg text-slate-300 font-medium max-w-2xl leading-relaxed mb-10 relative z-10">
                        Маршруты изучены, экипировка ждет, правила понятны. Осталось самое приятное — выбрать дату и насладиться свободой на воде. Мы обещаем, это будет незабываемо.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full relative z-10">
                        
                        {/* ГЛАВНАЯ КНОПКА (Ссылка на TourBrowser с фильтром SUP) */}
                        <Link 
                            // Замените href на ваш реальный путь к каталогу с параметром
                            href="/tour?category=sup" 
                            className="w-full sm:w-auto px-8 py-4 bg-teal-500 text-slate-950 font-black uppercase tracking-wider text-sm rounded-xl hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center gap-2"
                        >
                            <Map size={18} />
                            <span>Посмотреть расписание</span>
                        </Link>

                        {/* ВТОРОСТЕПЕННАЯ КНОПКА (Связь с гидом) */}
                        <button 
                            onClick={() => openContactModal('Вопрос по SUP-турам', 'TOUR')}
                            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} className="text-slate-400" />
                            <span>Остались сомнения?</span>
                        </button>

                    </div>
                </motion.div>

            </div>
        </section>
    );
}