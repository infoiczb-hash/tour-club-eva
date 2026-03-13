"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, HelpCircle, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
import { useModalStore } from '@/shared/store/useModalStore';
import { useKayakTab } from "./KayakingTabProvider";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function useInView(options = { threshold: 0.1, rootMargin: '-30px' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

const faqs = [
  { q: "Нужна ли специальная подготовка?", a: "Нет, сплав идеально подходит для новичков. Перед стартом мы проводим инструктаж по технике гребли, правилам поведения на воде и технике безопасности. До сплава даём видео и текстовые инструкции. Помогаем на воде освоить азы управления гребли, управления байдаркой и взаимодействия экипажа." },
  { q: "Можно ли брать детей на сплав?", a: "Да, дети допускаются с 2 лет в сопровождении родителей (в 2, 3-х местную байдарку) в багажный отсек с предоставлением сидушки. Мы выдаем детские страховочные жилеты." },
  { q: "Что если лодка перевернется?", a: "Наши байдарки обладают высокой остойчивостью на воде (при соблюдении правил безопасности), перевернуть их специально довольно сложно. Особое внимание при посадке и высадке из байдарки. Но даже в крайнем случае (который сложно представить) на вас будет спасательный жилет, а гид находится рядом и поможет вернуться в лодку за пару минут." },
  { q: "Как организован трансфер?", a: "Мы организуем централизованный сбор группы в городе. Заказной транспорт везет нас до места старта, а после финиша забирает и доставляет обратно (зависит от формата тура)." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const openContactModal = useModalStore((state) => state.openContactModal);
  const { setActiveTab } = useKayakTab();

  const headerView = useInView();
  const faqsView = useInView();

  const actionCardsContent = (
    <div className="flex flex-col gap-4 mt-2">
      {/* Кнопка "Подготовка к сплаву" */}
      <button
        onClick={() => {
          setActiveTab('participant');
          setTimeout(() => {
            const element = document.getElementById('packing-list');
            if (element) {
              const y = element.getBoundingClientRect().top + window.scrollY - 100;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 100);
        }}
        aria-label="Перейти к подготовке участника"
        className="group block w-full text-left outline-none"
      >
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 hover:bg-slate-900/80 hover:border-teal-500/30 transition-all duration-500 relative overflow-hidden cursor-pointer shadow-xl">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-teal-500/10 blur-[50px] rounded-full group-hover:bg-teal-500/20 transition-all duration-500" />
          <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500 border border-teal-500/20">
            <BookOpen size={24} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-teal-300 transition-colors">
            Подготовка к сплаву
          </h3>
          <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2">
            Полный гайд: что надеть, что взять с собой и как вести себя на воде.
          </p>
          <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-widest text-teal-500 group-hover:text-teal-400 transition-colors">
            <span>Перейти в раздел</span>
            <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
          </div>
        </div>
      </button>

      {/* Карточка "Остались вопросы?" */}
      <div className="p-6 md:p-8 bg-slate-900/40 border border-white/5 rounded-[2rem] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 shadow-xl">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Остались вопросы?</h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[250px]">
            Напишите нам. Мы на связи, чтобы помочь подобрать маршрут или развеять страхи.
          </p>
        </div>
        <button
          onClick={() => openContactModal('Сплавы на байдарках', 'TOUR')}
          className="w-full xl:w-auto shrink-0 px-6 py-3.5 bg-white text-slate-950 font-black uppercase tracking-wider text-sm rounded-xl hover:bg-teal-50 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
        >
          <MessageCircle size={20} />
          <span>Спросить</span>
        </button>
      </div>
    </div>
  );

  return (
    <section className="py-16 md:py-24 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-900/10 md:blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-32">
            <div
              ref={headerView.ref}
              style={{ opacity: headerView.inView ? 1 : 0, transform: headerView.inView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                <HelpCircle size={14} className="text-teal-400" />
                <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">ВОПРОСЫ/ОТВЕТЫ</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                Частые <br className="hidden lg:block" />
                <span className="text-teal-500">Вопросы</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base font-medium">
                Собрали самое важное для тех, кто идет на воду впервые. Узнайте всё о безопасности, экипировке и правилах.
              </p>
            </div>
            <div className="hidden lg:block">{actionCardsContent}</div>
          </div>

          {/* ПРАВАЯ КОЛОНКА — аккордеон (Чистый CSS Grid) */}
          <div
            ref={faqsView.ref}
            className="lg:col-span-7 space-y-3 md:space-y-4"
          >
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{ opacity: faqsView.inView ? 1 : 0, transform: faqsView.inView ? 'translateX(0)' : 'translateX(20px)', transition: `opacity 0.5s ease ${idx * 0.1}s, transform 0.5s ease ${idx * 0.1}s` }}
                  className={cn(
                    "border rounded-2xl overflow-hidden transition-all duration-300",
                    isOpen ? "bg-slate-900 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.1)]" : "bg-slate-900/40 border-white/5 hover:border-white/10"
                  )}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 md:p-6 flex justify-between items-center text-left group outline-none"
                  >
                    <span className={cn("text-base md:text-lg font-bold transition-colors tracking-tight pr-4", isOpen ? "text-white" : "text-slate-300 group-hover:text-white")}>
                      {faq.q}
                    </span>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300", isOpen ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-500 group-hover:text-white")}>
                      <ChevronDown className={cn("transition-transform duration-300", isOpen && "rotate-180")} size={18} />
                    </div>
                  </button>

                  {/* Нативная CSS анимация аккордеона через Grid */}
                  <div className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}>
                      <div className="overflow-hidden">
                        <p className="px-5 md:px-6 pb-5 md:pb-6 text-slate-400 leading-relaxed text-sm md:text-base font-medium">
                          {faq.a}
                        </p>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:hidden lg:col-span-12 border-t border-white/5 pt-8 mt-4">
            {actionCardsContent}
          </div>
        </div>
      </div>
    </section>
  );
}