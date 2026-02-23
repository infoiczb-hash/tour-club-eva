"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
import ContactHubModal from "@/components/modals/ContactHubModal";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { faqData } from "@/data/faq";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ДОБАВИЛИ ПРОПС: Компонент теперь ждет функцию для переключения страницы
export default function FAQ({ onNavigateToPrep }: { onNavigateToPrep?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); 
  const [isHubOpen, setIsHubOpen] = useState(false);

  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-900/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-emerald-900/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* ЛЕВАЯ КОЛОНКА */}
            <div className="lg:col-span-5 flex flex-col justify-start">
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
                        <HelpCircle size={14} className="text-teal-400" />
                        <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">FAQ</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-6">
                        Частые <br />
                        <span className="text-teal-500">Вопросы</span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-md leading-relaxed mb-10">
                        Собрали самое важное для тех, кто идет на воду впервые. Узнайте всё о безопасности, экипировке и правилах.
                    </p>

                    {/* НОВЫЙ БЛОК: Кнопка-карточка (вместо Link) */}
                    <button 
                        onClick={onNavigateToPrep} 
                        className="group block w-full text-left"
                    >
                        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 hover:bg-slate-900/80 hover:border-teal-500/30 transition-all duration-500 relative overflow-hidden cursor-pointer">
                            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-teal-500/10 blur-[50px] rounded-full group-hover:bg-teal-500/20 transition-all duration-500" />
                            
                            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500">
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

                </motion.div>
            </div>

            {/* ПРАВАЯ КОЛОНКА (Без изменений) */}
            <div className="lg:col-span-7">
                <div className="space-y-3 md:space-y-4 mb-10">
                {faqData.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    
                    return (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "border rounded-[1.5rem] overflow-hidden transition-all duration-300",
                                isOpen ? "bg-slate-900 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.1)]" : "bg-slate-900/40 border-white/5 hover:border-white/10"
                            )}
                        >
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className="w-full p-6 flex justify-between items-center text-left group"
                        >
                            <span className={cn(
                                "text-base md:text-lg font-bold transition-colors tracking-tight pr-4 leading-snug",
                                isOpen ? "text-white" : "text-slate-300 group-hover:text-white"
                            )}>
                            {faq.q}
                            </span>
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                                isOpen ? "bg-teal-500/10 text-teal-400" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
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
                                <div className="px-6 pb-6 pt-2">
                                    <div className="w-full h-px bg-white/5 mb-4" />
                                    <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium">
                                        {faq.a}
                                    </p>
                                </div>
                            </motion.div>
                            )}
                        </AnimatePresence>
                        </motion.div>
                    );
                })}
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 md:p-8 bg-gradient-to-br from-slate-900 to-[#020617] border border-white/5 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-2xl relative overflow-hidden group hover:border-teal-500/30 transition-colors duration-500"
                >
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-teal-500/5 blur-[60px] rounded-full group-hover:bg-teal-500/10 transition-colors" />
                    
                    <div className="relative z-10">
                        <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-2">
                            Остались вопросы?
                        </h3>
                        <p className="text-xs md:text-sm text-slate-400 font-medium max-w-[250px] leading-relaxed">
                            Напишите нам. Мы на связи, чтобы помочь подобрать маршрут.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setIsHubOpen(true)}
                        className="w-full sm:w-auto relative z-10 shrink-0 px-6 py-3.5 bg-white text-slate-950 font-black uppercase tracking-wider text-sm rounded-xl hover:bg-teal-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={16} />
                        <span>Спросить</span>
                    </button>
                </motion.div>
            </div>

        </div>

      </div>

      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="HELP" 
      />

    </section>
  );
}