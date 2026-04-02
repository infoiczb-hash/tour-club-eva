'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircleQuestion, Quote, CheckCircle2, MessageCircle } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';
import { clsx } from 'clsx';
import { twMerge } from "tailwind-merge";
import Image from 'next/image';
// ✅ ДОБАВЛЕНО: Глобальный оптимизированный хук
import { useInView } from '@/hooks/useInView';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Обновленный FadeBlock с использованием глобального хука
function FadeBlock({ children, delay = 0, startX = 0, startY = 20, className = '' }: any) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '-30px' });
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0, 0)' : `translate(${startX}px, ${startY}px)`,
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
      }}
    >
      {children}
    </div>
  );
}

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
    const openContactModal = useModalStore((state) => state.openContactModal);

    const toggleAccordion = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section className="py-8 md:py-12 bg-slate-950 relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-4 max-w-4xl relative z-10">
                
                {/* ВОПРОСЫ (FAQ) */}
                <FadeBlock startX={-20} startY={0} className="flex flex-col items-start text-left mb-8 md:mb-12 max-w-2xl">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 mb-4 md:mb-6 shadow-xl">
                        <MessageCircleQuestion className="text-amber-500" size={24} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Частые <span className="text-amber-500">Вопросы</span>
                    </h2>
                    <p className="text-slate-300 text-[14px] md:text-base font-medium leading-tight md:leading-tight">
                        Отвечаем на то, что больше всего волнует родителей перед первой поездкой.
                    </p>
                </FadeBlock>

                {/* АККОРДЕОН (CSS Grid) */}
                <div className="space-y-3 md:space-y-4 mb-12 md:mb-16">
                    {FAQ_DATA.map((item, index) => {
                        const isOpen = openId === item.id;
                        return (
                            <FadeBlock 
                                key={item.id}
                                delay={index * 0.1}
                                startY={20}
                                className={cn(
                                    "bg-slate-900/60 border rounded-2xl overflow-hidden transition-colors duration-300",
                                    isOpen ? "border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "border-white/5 hover:border-amber-500/20 hover:bg-slate-900"
                                )}
                            >
                               <button
                                  onClick={() => toggleAccordion(item.id)}
                                  aria-expanded={openId === item.id}
                                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
                                >
                                    <h3 className={cn(
                                        "text-[15px] md:text-lg font-bold pr-6 transition-colors duration-300",
                                        isOpen ? "text-amber-400" : "text-white group-hover:text-amber-200"
                                    )}>
                                        {item.q}
                                    </h3>
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300",
                                            isOpen ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800 border-transparent group-hover:bg-slate-700"
                                        )}
                                    >
                                        <ChevronDown size={18} className={cn("transition-transform duration-300", isOpen ? "rotate-180 text-amber-400" : "text-slate-300")} />
                                    </div>
                                </button>

                                <div className={cn(
                                    "grid transition-all duration-300 ease-in-out",
                                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <div className="overflow-hidden">
                                        <div className="p-5 md:p-6 pt-0 text-slate-300 text-[14px] md:text-base leading-tight md:leading-tight font-medium border-t border-white/5 mt-2">
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            </FadeBlock>
                        );
                    })}
                </div>

                {/* ФИНАЛЬНЫЙ CTA + ЦИТАТА */}
                <FadeBlock startY={30} className="relative p-6 md:p-12 lg:p-16 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-900 to-[#020617] border border-amber-500/20 overflow-hidden text-center shadow-2xl isolate">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 md:blur-[120px] rounded-full pointer-events-none" />

                    <div className="mb-10 md:mb-16 relative">
                        <Quote className="w-10 h-10 md:w-12 md:h-12 text-amber-500/20 mx-auto mb-4 md:mb-6" />
                        <h3 className="text-lg md:text-3xl font-bold text-white mb-6 md:mb-8 max-w-3xl mx-auto leading-tight md:leading-tight md:leading-normal">
                            "Дети раскрываются не в кабинетах, а у костра. Я вижу, как подросток, который вчера боялся лягушек, сегодня ведёт за собой других. <span className="text-amber-500">Это и есть настоящая работа</span>."
                        </h3>
                      <div className="flex items-center justify-center gap-4">
    <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-800 rounded-full border border-amber-500/30 overflow-hidden shrink-0 shadow-lg">
        {/* 🔥 Вставляем фото вместо буквы "Р" */}
        <Image 
            src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1773397829/sandu-roman_v0swmg.jpg" /* ЗАМЕНИ НА РЕАЛЬНУЮ ССЫЛКУ ИЗ БАЗЫ */
            alt="Роман Санду" 
            fill 
            className="object-cover" 
            sizes="(max-width: 768px) 48px, 56px"
        />
    </div>
    <div className="text-left">
        <div className="text-white font-bold text-base md:text-lg">Роман Санду</div>
        <div className="text-amber-500 text-[12px] md:text-xs uppercase font-bold tracking-widest mt-0.5">Основатель ТурКлуба</div>
    </div>

                        </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10 md:mb-16" />

                    <h2 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6">
                        Готовы к <span className="text-emerald-500">Приключению?</span>
                    </h2>
                    
                    <div className="max-w-2xl mx-auto mb-8 md:mb-10 text-left relative z-10">
                     <p className="text-slate-300 font-medium leading-[1.15] text-[14px] md:text-base mb-6 text-left">
    Напишите нам — мы ответим на все вопросы, подберём тур и пришлём памятку по сборам.
    <br className="hidden md:block" />
    <span className="text-amber-500 font-bold">Чтобы гарантировать даты туров для вас, просим бронировать их заранее.</span>
</p>

                        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 md:p-8 border border-white/5 mb-6 md:mb-8 shadow-inner">
                            <p className="text-white font-bold mb-4 md:mb-5 flex items-center gap-2 text-base md:text-lg">
                                💌 После заявки мы:
                            </p>
                            <ul className="space-y-3 md:space-y-4 text-slate-300 text-[14px] md:text-base font-medium">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                    <span>Поможем выбрать подходящий тур по возрасту и уровню готовности.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                    <span>Пришлём подробный список вещей (что брать, а что точно не нужно).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                    <span>Расскажем, как всё будет устроено на маршруте.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                    <span>Поддержим вас — от первого вопроса до возвращения ребёнка домой.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-center w-full relative z-10 max-w-xl mx-auto">
                        <button 
                            onClick={() => openContactModal('Заявка: Junior Академия', 'TOUR')}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-slate-950 font-black uppercase tracking-wider text-[14px] rounded-xl hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} />
                            <span>Связаться с нами</span>
                        </button>
                    </div>
                </FadeBlock>

            </div>
        </section>
    );
}