'use client';

import { motion } from 'framer-motion';
import { Users, Compass, Mountain, Check } from 'lucide-react';

const FORMATS = [
    {
        id: "01",
        title: "Тимбилдинг и Корпоратив",
        target: "Для компаний и IT-команд",
        capacity: "15 — 100+ человек",
        icon: Users,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        desc: "Сплочение через совместное преодоление без экстрима. Сплавы на байдарках, квесты на природе и вечеринки у огромного костра. Идеально для снятия стресса и неформального общения коллег.",
        features: ["Организация массового сплава", "Командные испытания", "Барбекю и вечерний костер", "Трансфер на больших автобусах"]
    },
    {
        id: "02",
        title: "Ретриты и Практики",
        target: "Для мастеров и студий",
        capacity: "10 — 30 человек",
        icon: Compass,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        desc: "Вы привозите людей и даете свою программу (йога, психология, медитации). А мы строим тихий, эстетичный лагерь, готовим полезную еду и растворяемся, не мешая вашим практикам.",
        features: ["Тихие, уединенные локации", "Вегетарианское/диетическое меню", "Тенты для практик от дождя/солнца", "Полная тишина от организаторов"]
    },
    {
        id: "03",
        title: "Стратсессии (Топ-менеджмент)",
        target: "Для руководителей",
        capacity: "5 — 15 человек",
        icon: Mountain,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        desc: "Премиум-формат для узкого круга. Глубокое погружение в бизнес-процессы вдали от городской суеты. Максимальный уровень комфорта, тишина и фокус на стратегических задачах.",
        features: ["Закрытые локации в горах/лесу", "Повышенный комфорт лагеря", "Персональный шеф-повар", "Полная конфиденциальность"]
    }
];

export default function OrgFormats() {
    return (
        <section className="py-12 md:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            {/* Типографический фон */}
            <div className="absolute top-10 left-10 text-[20vw] font-black text-slate-800/10 leading-none select-none pointer-events-none">
                B2B
            </div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 md:mb-24"
                >
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                        Что мы можем предложить <span className="text-indigo-500">Вам</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl">
                        Вы можете выбрать любой наш тур или мы создадим инфраструктуру под цель вашего выезда: от шумного праздника до тихой медитации.
                    </p>
                </motion.div>

                <div className="flex flex-col gap-8 md:gap-12">
                    {FORMATS.map((format, idx) => {
                        const Icon = format.icon;
                        return (
                            <motion.div 
                                key={format.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-8 md:p-10 bg-slate-900/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-colors group"
                            >
                                {/* Левая колонка: Цифра и Иконка */}
                                <div className="shrink-0 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-6 lg:w-48">
                                    <div className="text-6xl md:text-7xl font-black text-slate-800 group-hover:text-indigo-900/50 transition-colors leading-none">
                                        {format.id}
                                    </div>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${format.bg} ${format.border} ${format.color}`}>
                                        <Icon size={32} strokeWidth={1.5} />
                                    </div>
                                </div>

                                {/* Центральная колонка: Описание */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${format.bg} ${format.border} ${format.color}`}>
                                            {format.target}
                                        </span>
                                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
                                            {format.capacity}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-black text-white mb-6 tracking-tight">
                                        {format.title}
                                    </h3>
                                    <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                                        {format.desc}
                                    </p>
                                </div>

                                {/* Правая колонка: Чеклист */}
                                <div className="lg:w-72 shrink-0 flex flex-col justify-center">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Что входит в базу:</div>
                                    <ul className="space-y-3">
                                        {format.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                    <Check size={12} className="text-indigo-400" />
                                                </div>
                                                <span className="text-sm text-slate-300 font-medium leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}