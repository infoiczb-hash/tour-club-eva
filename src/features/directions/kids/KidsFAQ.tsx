'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion, MessageCircle, Quote, CheckCircle2, Map } from 'lucide-react';
import Link from 'next/link';
import ContactHubModal from "@/components/modals/ContactHubModal";
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// РЕАЛЬНЫЕ ВОПРОСЫ РОДИТЕЛЕЙ
const FAQ_DATA = [
    { 
        id: 1,
        q: "С какого возраста берете детей?", 
        a: "Однодневные программы (например, «Один день в лесу») рассчитаны на детей от 8 лет. Туры с ночевкой и сплавы — от 10-11 лет, в зависимости от формата. Если сомневаетесь — напишите нам, мы подберем лучший вариант." 
    },
    { 
        id: 2,
        q: "Можно ли дать ребенку с собой телефон?", 
        a: "Мы настоятельно просим оставлять гаджеты дома или сдавать гиду на старте. Наша цель — цифровой детокс. У инструкторов всегда есть связь, и если нужно, вы сможете поговорить с ребенком вечером." 
    },
    { 
        id: 3,
        q: "Что с едой? У моего ребенка аллергия.", 
        a: "Мы готовим на костре простую, сытную и полезную походную еду. Если у ребенка есть пищевая аллергия или непереносимость (например, лактозы), просто сообщите нам об этом заранее, и мы скорректируем меню." 
    },
    { 
        id: 4,
        q: "Нужна ли специальная физическая подготовка?", 
        a: "Нет. Наши маршруты продуманы так, чтобы с ними справился любой здоровый ребенок. Главное — удобная обувь по погоде и желание открывать новое." 
    }
];

export default function KidsFAQ() {
    const [openId, setOpenId] = useState<number | null>(null);
    const [isHubOpen, setIsHubOpen] = useState(false);

    const toggleAccordion = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                
                {/* === БЛОК 1: ВОПРОСЫ (FAQ) === */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center mb-12"
                >
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 mb-6 shadow-xl">
                        <MessageCircleQuestion className="text-amber-500" size={28} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                        Частые <span className="text-amber-500">Вопросы</span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
                        Отвечаем на то, что больше всего волнует родителей перед первой поездкой.
                    </p>
                </motion.div>

                {/* АККОРДЕОН */}
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
                                    isOpen ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "border-white/5 hover:border-amber-500/20 hover:bg-slate-900"
                                )}
                            >
                                <button 
                                    onClick={() => toggleAccordion(item.id)}
                                    className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
                                >
                                    <h3 className={cn(
                                        "text-base md:text-lg font-bold pr-6 transition-colors duration-300",
                                        isOpen ? "text-amber-400" : "text-white group-hover:text-amber-200"
                                    )}>
                                        {item.q}
                                    </h3>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                            isOpen ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800 border-transparent group-hover:bg-slate-700"
                                        )}
                                    >
                                        <ChevronDown size={18} className={isOpen ? "text-amber-400" : "text-slate-400"} />
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

                {/* === БЛОК 2: ФИНАЛЬНЫЙ CTA + ЦИТАТА РОМАНА === */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative p-8 md:p-12 lg:p-16 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-900 to-[#020617] border border-amber-500/20 overflow-hidden text-center shadow-2xl isolate"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

                    {/* Цитата Романа */}
                    <div className="mb-12 md:mb-16 relative">
                        <Quote className="w-12 h-12 text-amber-500/20 mx-auto mb-6" />
                        <h3 className="text-xl md:text-3xl font-bold text-white mb-8 max-w-3xl mx-auto leading-relaxed md:leading-normal">
                            "Дети раскрываются не в кабинетах, а у костра. Я вижу, как подросток, который вчера боялся лягушек, сегодня ведёт за собой других. <span className="text-amber-500">Это и есть настоящая работа</span>."
                        </h3>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center border border-amber-500/30 overflow-hidden relative shrink-0">
                                <span className="text-slate-400 font-bold text-lg">Р</span>
                            </div>
                            <div className="text-left">
                                <div className="text-white font-bold text-lg">Роман Санду</div>
                                <div className="text-amber-500 text-[10px] md:text-xs uppercase font-bold tracking-widest mt-0.5">Основатель ТурКлуба «ЭВА»</div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12 md:mb-16" />

                    {/* ПРИЗЫВ К ДЕЙСТВИЮ (Мягкий и заботливый) */}
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                        Готовы к <span className="text-emerald-500">Приключению?</span>
                    </h2>
                    
                    <div className="max-w-2xl mx-auto mb-10 text-left relative z-10">
                        <p className="text-slate-300 font-medium leading-relaxed text-sm md:text-base mb-6 text-center">
                            Напишите нам — мы ответим на все вопросы, подберём тур и пришлём памятку по сборам.
                            <br className="hidden md:block" />
                            <span className="text-amber-500 font-bold">Группы маленькие, поэтому бронируем места заранее.</span> Это нужно, чтобы каждый ребенок получил максимум внимания и заботы.
                        </p>

                        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/5 mb-8 shadow-inner">
                            <p className="text-white font-bold mb-5 flex items-center gap-2 text-lg">
                                💌 После заявки мы:
                            </p>
                            <ul className="space-y-4 text-slate-300 text-sm md:text-base font-medium">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                    <span>Поможем выбрать подходящий тур по возрасту и уровню готовности.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                    <span>Пришлём подробный список вещей (что брать, а что точно не нужно).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                    <span>Расскажем, как всё будет устроено на маршруте.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                                    <span>Поддержим вас — от первого вопроса до возвращения ребёнка домой.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* КНОПКИ (TourBrowser и ContactHub) */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full relative z-10 max-w-xl mx-auto">
                        <Link 
                            href="/tour?category=kids" 
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-slate-950 font-black uppercase tracking-wider text-sm rounded-xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                        >
                            <Map size={18} />
                            <span>Посмотреть расписание</span>
                        </Link>

                        <button 
                            onClick={() => setIsHubOpen(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} className="text-slate-400" />
                            <span>Связаться с нами</span>
                        </button>
                    </div>
                </motion.div>

            </div>

            {/* Модалка связи */}
            <ContactHubModal 
                isOpen={isHubOpen} 
                onClose={() => setIsHubOpen(false)} 
                initialTab="HELP" 
            />
        </section>
    );
}