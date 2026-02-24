"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
import ContactHubModal from "@/components/modals/ContactHubModal";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const faqs = [
  {
    q: "Нужна ли специальная подготовка?",
    a: "Нет, сплав идеально подходит для новичков. Перед стартом мы проводим детальный 30-минутный инструктаж по технике гребли, правилам поведения на воде и технике безопасности."
  },
  {
    q: "Можно ли брать детей на сплав?",
    a: "Да, дети допускаются с 7 лет в сопровождении родителей (в 3-х местную байдарку). Мы выдаем специальные сертифицированные детские спасательные жилеты по размеру."
  },
  {
    q: "Что если лодка перевернется?",
    a: "Наши байдарки (Таймень) обладают высокой остойчивостью, перевернуть их специально довольно сложно. Но даже в крайнем случае на вас будет спасательный жилет, а гид находится рядом и поможет вернуться в лодку за пару минут."
  },
  {
    q: "Как организован трансфер?",
    a: "Мы организуем централизованный сбор группы в городе. Заказной транспорт везет нас до места старта, а после финиша забирает и доставляет обратно. Никакой головной боли с логистикой."
  }
];

interface FAQProps {
  onNavigateToPrep?: () => void;
}

export default function FAQ({ onNavigateToPrep }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isHubOpen, setIsHubOpen] = useState(false);

  return (
    <section className="py-20 md:py-32 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      
      {/* Декор фона */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        
        {/* ЗАГОЛОВОК */}
        <div className="text-center mb-12 md:mb-16">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                    <HelpCircle size={14} className="text-teal-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">FAQ</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                    Частые <span className="text-teal-500">Вопросы</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto">
                    Собрали самое важное для тех, кто идет на воду впервые.
                </p>
            </motion.div>
        </div>

        {/* АККОРДЕОН */}
        <div className="space-y-3 md:space-y-4 mb-12">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
                <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                        "border rounded-2xl overflow-hidden transition-all duration-300",
                        isOpen ? "bg-slate-900 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.1)]" : "bg-slate-900/40 border-white/5 hover:border-white/10"
                    )}
                >
                <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 md:p-6 flex justify-between items-center text-left group"
                >
                    <span className={cn(
                        "text-base md:text-lg font-bold transition-colors tracking-tight pr-4",
                        isOpen ? "text-white" : "text-slate-300 group-hover:text-white"
                    )}>
                    {faq.q}
                    </span>
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300",
                        isOpen ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-500 group-hover:text-white"
                    )}>
                        <ChevronDown 
                            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                            size={18} 
                        />
                    </div>
                </button>
                
                <AnimatePresence>
                    {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="px-5 md:px-6 pb-5 md:pb-6 text-slate-400 leading-relaxed text-sm md:text-base font-medium">
                        {faq.a}
                        </p>
                    </motion.div>
                    )}
                </AnimatePresence>
                </motion.div>
            );
          })}
        </div>

        {/* НИЖНИЙ БЛОК: Кнопка-мост + Центр связи */}
        <div className="flex flex-col gap-6">
            {/* НОВЫЙ БЛОК: Кнопка-карточка "Подготовка к сплаву" */}
            {onNavigateToPrep && (
                <motion.button 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={onNavigateToPrep} 
                    className="group block w-full text-left outline-none"
                >
                    <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 hover:bg-slate-900/80 hover:border-teal-500/30 transition-all duration-500 relative overflow-hidden cursor-pointer shadow-xl">
                        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-teal-500/10 blur-[50px] rounded-full group-hover:bg-teal-500/20 transition-all duration-500" />
                        
                        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500 border border-teal-500/20">
                            <BookOpen size={24} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-teal-300 transition-colors">
                            Подготовка к сплаву
                        </h3>
                        <p className="text-sm md:text-base text-slate-400 font-medium mb-6 line-clamp-2">
                            Полный гайд: что надеть, что взять с собой и как вести себя на воде.
                        </p>
                        
                        <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-widest text-teal-500 group-hover:text-teal-400 transition-colors">
                            <span>Перейти в раздел</span>
                            <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                    </div>
                </motion.button>
            )}

            {/* CTA: ЦЕНТР СВЯЗИ (Замыкание воронки) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 md:p-8 bg-gradient-to-r from-teal-900/30 to-slate-900 border border-teal-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left shadow-2xl"
            >
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2">
                        Не нашли ответ?
                    </h3>
                    <p className="text-sm text-slate-400 font-medium max-w-sm leading-relaxed">
                        Напишите нам. Мы на связи, чтобы помочь подобрать маршрут или развеять страхи.
                    </p>
                </div>
                
                <button 
                    onClick={() => setIsHubOpen(true)}
                    className="w-full md:w-auto shrink-0 px-8 py-4 bg-white text-slate-950 font-black uppercase tracking-wider rounded-xl hover:bg-teal-50 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                    <MessageCircle size={18} />
                    <span>Задать вопрос</span>
                </button>
            </motion.div>
        </div>

      </div>

      {/* Модалка Связи */}
      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="HELP" 
      />

    </section>
  );
}