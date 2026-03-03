"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shirt, Footprints, Briefcase, 
  Lightbulb, Dog, Coffee, Thermometer, CheckSquare, ChevronRight
} from "lucide-react"; // 🔥 Добавили ChevronRight

type TripDuration = "one-day" | "two-days";

export default function PackingList() {
  const [activeDuration, setActiveDuration] = useState<TripDuration>("one-day");

  return (
    <section className="py-12 md:py-20 bg-[#020617] text-slate-200 overflow-hidden font-sans border-t border-white/5 relative">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4">
                <Briefcase size={14} className="text-teal-400" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-teal-400">Экипировка</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                Что взять <span className="text-teal-500">с собой</span>
            </h2>

            {/* 🔥 1. Switcher for Duration (Строго в один ряд без переносов) */}
            <div className="inline-flex max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                <button 
                    onClick={() => setActiveDuration("one-day")}
                    className={`shrink-0 px-5 md:px-6 py-2.5 rounded-xl text-[12px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeDuration === 'one-day' ? 'bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'bg-transparent text-slate-400 hover:text-white'}`}
                >
                    Однодневный сплав
                </button>
                <button 
                    onClick={() => setActiveDuration("two-days")}
                    className={`shrink-0 px-5 md:px-6 py-2.5 rounded-xl text-[12px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeDuration === 'two-days' ? 'bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'bg-transparent text-slate-400 hover:text-white'}`}
                >
                    С ночевкой
                </button>
            </div>
        </div>

        {/* CONTENT AREA */}
        <motion.div
            key={activeDuration}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
        >
            {/* 🔥 3 и 4. Обертка для скролла с подсказкой */}
            <div className="relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-5 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Одежда */}
                    <CategoryCard 
                        title="Одежда" 
                        icon={Shirt} 
                        items={activeDuration === 'one-day' 
                            ? ["Шляпа/панама (закрывающая уши и плечи)", "Одежда с длинным рукавом (от солнца)", "Шорты/лосины (ниже колена)", "Сменная одежда", "Легкая ветровка"]
                            : ["Шляпа/панама (от солнца)", "Одежда с длинным рукавом", "Шорты/лосины", "Сменная одежда для лагеря", "Теплый батник/ветровка на вечер", "Комплект для сна"]}
                    />
                    {/* Обувь */}
                    <CategoryCard 
                        title="Обувь" 
                        icon={Footprints} 
                        items={["Обувь для воды (сандалии, кроксы, шлепки)", "Запасные сухие носки", "Сменная сухая обувь (кроссовки)"]}
                    />
                    {/* Личные вещи */}
                    <CategoryCard 
                        title="Личные вещи" 
                        icon={Briefcase} 
                        items={activeDuration === 'one-day' 
                            ? ["Вода (0.5–1.5л)", "Солнцезащитный крем (SPF) и очки", "Купальник и пакет для мокрых вещей", "Многоразовая посуда (миска, ложка, чашка)"]
                            : ["Вода (от 2л на человека)", "Солнцезащитный крем (SPF) и очки", "Купальник и пакет для мокрых вещей", "Средства гигиены", "Многоразовая посуда (миска, ложка, чашка)", "Фонарик (желательно налобный)"]}
                    />
                </div>

                {/* 🔥 Подсказка "Мотай" */}
                <div className="md:hidden absolute bottom-2 right-4 flex items-center gap-1 text-teal-500/80 animate-pulse pointer-events-none">
                    <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
                    <ChevronRight size={14} />
                </div>
            </div>

            {/* Подсказки и Лайфхаки (Уплотнили отступы) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-4 md:mt-8">
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-[2rem] p-5 md:p-6 flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center shrink-0 text-teal-400"><Coffee size={20} className="md:w-6 md:h-6"/></div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight text-white mb-1.5 md:mb-2">Эко-правило</h4>
                        {/* 🔥 2. Текст 14px */}
                        <p className="text-[14px] text-slate-300 leading-relaxed">Мы не используем одноразовую посуду на сплавах. Пожалуйста, возьмите свои многоразовые приборы, чтобы сохранить природу чистой.</p>
                    </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-5 md:p-6 flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 text-amber-500"><Lightbulb size={20} className="md:w-6 md:h-6"/></div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight text-white mb-1.5 md:mb-2">Лайфхак #1</h4>
                        {/* 🔥 2. Текст 14px */}
                        <p className="text-[14px] text-slate-300 leading-relaxed">Возьмите кусок х/б ткани (простыни). Ей можно закрыть ноги от обгорания в лодке, а на стоянке — накрыть сиденье, чтобы оно не пекло.</p>
                    </div>
                </div>
            </div>

            {/* Теги внизу (Чуть увеличили шрифт для читабельности) */}
            <div className="mt-6 flex flex-wrap gap-2 md:gap-3 justify-center">
                <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-slate-400"><Thermometer size={14} className="text-teal-500"/> Учитывайте прогноз погоды</span>
                <span className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] md:text-[12px] font-bold uppercase tracking-widest text-slate-400"><Dog size={14} className="text-teal-500"/> Собаки по согласованию с гидом</span>
            </div>
        </motion.div>

      </div>
    </section>
  );
}

// --- SUB-COMPONENT ---
function CategoryCard({ title, icon: Icon, items }: { title: string, icon: any, items: string[] }) {
  return (
    // 🔥 5. Уплотнили карточку: скругления rounded-[2rem], паддинг p-5
    <div className="snap-center shrink-0 w-[85vw] md:w-auto bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 md:p-6 hover:border-teal-500/30 transition-all group flex flex-col h-full">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 md:mb-5 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all shrink-0">
        <Icon size={20} className="md:w-6 md:h-6" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg md:text-xl font-black text-white uppercase mb-4 tracking-tight">{title}</h3>
      <ul className="space-y-3 mt-auto">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[14px] text-slate-300 font-medium leading-snug">
            <div className="mt-0.5 shrink-0"><CheckSquare size={16} className="text-teal-500/50 group-hover:text-teal-400 transition-colors" /></div>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}