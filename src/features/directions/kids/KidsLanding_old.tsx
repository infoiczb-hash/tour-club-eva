'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Tent, Compass, MapPin, Star, Phone, MessageCircle,
  Calendar, Quote, ArrowRight, Sun, Baby, CheckCircle, 
  ShieldCheck, Users, HeartHandshake, PhoneCall
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function KidsLanding() {
  return (
    <div className="text-slate-200">
      <HeroSection />
      <ForParentsSection />
      <TransformationSection />
      <ShowcaseSection />
      <OneDaySection />
      <TeamSection />
      <FAQSection />
      <ContactCenterSection />
    </div>
  );
}

// --- 1. HERO (Атмосфера костра) ---
function HeroSection() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Фон */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1920&q=80"
          alt="Kids Camping"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-full mb-8">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              Детское направление
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.9]">
            ВМЕСТО ЭКРАНА <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              КОСТЁР
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-300 mb-12 font-light max-w-3xl mx-auto leading-relaxed">
            Мы возвращаем детям детство. Настоящие друзья, 
            ночевки в палатках и приключения, которыми гордишься.
          </p>

          <motion.button 
            onClick={() => document.getElementById('contact-center')?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all flex items-center gap-3 mx-auto text-lg"
          >
            <Compass className="w-6 h-6" />
            Выбрать приключение
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// --- 2. FOR PARENTS (Боли и Решения) ---
function ForParentsSection() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8 uppercase">
              Мы знаем ваши <span className="text-emerald-500">Вопросы</span>
            </h2>
            <div className="space-y-6">
               <FearItem text="А вдруг он испугается без мамы?" />
               <FearItem text="Безопасно ли это в лесу?" />
               <FearItem text="Что если он никого не знает?" />
            </div>
            
            <div className="mt-10 p-6 bg-slate-900/50 border-l-4 border-emerald-500 rounded-r-2xl">
                <p className="text-lg text-slate-300 italic">
                    "Моя задача — не научить выживать, а научить дружить и верить в себя. 
                    Через 2 часа у костра дети забывают про телефоны."
                </p>
                <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full overflow-hidden">
                         {/* Avatar Placeholder */}
                         <div className="w-full h-full bg-slate-700 animate-pulse" /> 
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">Алексей</div>
                        <div className="text-emerald-500 text-xs uppercase font-bold">Главный инструктор</div>
                    </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <BenefitCard 
                icon={<ShieldCheck size={32} className="text-emerald-400" />}
                title="Безопасность №1"
                desc="Инструкторы с сертификатами первой помощи. Связь 24/7. Проверенные маршруты без рисков."
             />
             <BenefitCard 
                icon={<Users size={32} className="text-amber-400" />}
                title="Малые группы"
                desc="До 12 детей на 2 инструкторов. Мы видим настроение каждого ребенка и помогаем влиться."
             />
             <BenefitCard 
                icon={<HeartHandshake size={32} className="text-blue-400" />}
                title="Атмосфера"
                desc="Никакого буллинга. У нас принято поддерживать, делиться едой и помогать ставить палатку."
             />
          </div>

        </div>
      </div>
    </section>
  );
}

function FearItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-4 opacity-70">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-lg text-slate-400 line-through decoration-slate-600 decoration-2">{text}</span>
        </div>
    )
}

function BenefitCard({ icon, title, desc }: any) {
    return (
        <div className="p-6 bg-slate-900 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start gap-4">
                <div className="shrink-0 p-3 bg-slate-950 rounded-xl border border-white/5">{icon}</div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
                </div>
            </div>
        </div>
    )
}

// --- 3. TRANSFORMATION (Было / Стало) ---
function TransformationSection() {
    return (
        <section className="py-20 bg-slate-950">
             <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl md:text-5xl font-black text-white mb-16 uppercase">
                    Что <span className="text-amber-500">Меняется?</span>
                 </h2>
                 <div className="grid md:grid-cols-3 gap-8">
                     <TransItem 
                        icon={<Flame size={40} />} 
                        from="Телефон" to="Костёр" 
                        desc="Учатся разжигать огонь, готовить еду и говорить глядя в глаза."
                        color="text-amber-500"
                     />
                     <TransItem 
                        icon={<Compass size={40} />} 
                        from="Страх" to="Действие" 
                        desc="Первый раз сам принял решение. Первый раз справился. Гордость."
                        color="text-emerald-500"
                     />
                     <TransItem 
                        icon={<Users size={40} />} 
                        from="Я Сам" to="Мы Команда" 
                        desc="Здесь находят друзей не по лайкам, а по тому, кто помог нести рюкзак."
                        color="text-blue-500"
                     />
                 </div>
             </div>
        </section>
    )
}

function TransItem({ icon, from, to, desc, color }: any) {
    return (
        <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 hover:bg-slate-900 transition-colors group">
            <div className={`mb-6 flex justify-center ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
            <div className="flex items-center justify-center gap-3 text-xl font-bold mb-4">
                <span className="text-slate-500 line-through decoration-2 decoration-red-500/50">{from}</span>
                <ArrowRight size={16} className="text-slate-600" />
                <span className="text-white">{to}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    )
}

// --- 4. SHOWCASE (Хардкод Туров - Витрина) ---
function ShowcaseSection() {
    const tours = [
        {
            title: "Лесной Старт",
            tags: ["1 день", "8+ лет", "Без ночевки"],
            desc: "Идеально для первого раза. Веревочный курс, поиск сокровищ и обед на костре. Возвращаемся вечером довольные и чумазые.",
            img: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d"
        },
        {
            title: "Водная Команда",
            tags: ["1 день", "10+ лет", "Сплав"],
            desc: "Учимся управлять байдаркой. Командная работа, безопасность на воде и пикник на диком острове.",
            img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5"
        },
        {
            title: "Путь Героев",
            tags: ["2 дня", "12+ лет", "Палатки"],
            desc: "Настоящий поход с ночевкой. Ставим лагерь, готовим ужин, смотрим на звезды и рассказываем истории.",
            img: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"
        }
    ];

    return (
        <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase text-center">
                    Наши <span className="text-amber-500">Форматы</span>
                </h2>
                <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                    Мы не продаем даты, мы создаем опыт. Выберите формат, который подойдет вашему ребенку.
                </p>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {tours.map((tour, i) => (
                        <div key={i} className="group bg-slate-950 rounded-3xl overflow-hidden border border-white/5 hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col">
                            <div className="relative h-56 overflow-hidden">
                                <Image src={tour.img} alt={tour.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                    {tour.tags.map(t => (
                                        <span key={t} className="px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase text-amber-400 rounded-lg border border-amber-500/20">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-1">
                                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-amber-500 transition-colors">{tour.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{tour.desc}</p>
                                {/* Убрали кнопку "Купить", оставили информационный стиль */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// --- 5. ONE DAY (Timeline) ---
function OneDaySection() {
    const steps = [
        { time: "09:00", title: "Встреча", desc: "Знакомимся, сдаем гаджеты, делимся на отряды." },
        { time: "11:00", title: "Лес", desc: "Квест по ориентированию. Ищем 'артефакты'." },
        { time: "14:00", title: "Костер", desc: "Учимся готовить походный суп. Сами!" },
        { time: "16:00", title: "Мастерская", desc: "Вяжем узлы или строим шалаш." },
        { time: "19:00", title: "Свечка", desc: "Делимся эмоциями. Возвращение домой героями." },
    ];

    return (
        <section className="py-24 bg-slate-950">
             <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-16 uppercase text-center">
                    Один <span className="text-emerald-500">День</span> из жизни
                </h2>
                
                <div className="relative border-l-2 border-slate-800 ml-4 md:ml-0 space-y-12">
                    {steps.map((step, i) => (
                        <div key={i} className="relative pl-8 md:pl-0">
                            {/* Dot */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-500 shadow-[0_0_10px_#10b981]" />
                            
                            <div className="md:flex items-start gap-8 group">
                                <div className="md:w-32 md:text-right shrink-0 mb-2 md:mb-0">
                                    <span className="text-2xl font-black text-slate-500 group-hover:text-emerald-400 transition-colors">{step.time}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-slate-400 text-sm">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </section>
    )
}

// --- 6. TEAM & TRUST ---
function TeamSection() {
    return (
        <section className="py-20 bg-emerald-950/20 border-y border-emerald-500/10">
            <div className="container mx-auto px-4 text-center">
                <Quote className="w-12 h-12 text-emerald-500 mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 max-w-3xl mx-auto leading-tight">
                    "Сын вернулся и 2 часа рассказывал про костёр. 
                    <span className="text-emerald-400"> Первый раз за полгода оторвался от телефона</span> 
                    и сам попросил поехать ещё."
                </h3>
                <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">М</div>
                    <div className="text-left">
                        <div className="text-white font-bold">Мария</div>
                        <div className="text-slate-500 text-xs">мама Максима (11 лет)</div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// --- 7. FAQ ---
function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const questions = [
        { q: "С какого возраста берете?", a: "Однодневные программы — с 8 лет. Походы с ночевкой — с 10-12 лет (зависит от подготовки)." },
        { q: "Можно дать с собой телефон?", a: "Мы просим не давать. У гида есть связь. Если нужно — ребенок позвонит вам вечером. Дайте ему отдохнуть от экрана." },
        { q: "Что с едой? У нас аллергия.", a: "Мы готовим на костре простую и полезную еду. Если есть аллергия — сообщите заранее, мы скорректируем меню." },
    ];

    return (
        <section className="py-24 bg-slate-950">
            <div className="container mx-auto px-4 max-w-2xl">
                <h2 className="text-3xl font-black text-white mb-12 uppercase text-center">Вопросы</h2>
                <div className="space-y-4">
                    {questions.map((item, i) => (
                        <div key={i} className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800 transition-colors"
                            >
                                <span className="font-bold text-white text-sm md:text-base pr-4">{item.q}</span>
                                <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>
                                    <ArrowRight size={14} className="rotate-90 text-slate-400"/>
                                </div>
                            </button>
                            {openIndex === i && (
                                <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// --- 8. CONTACT CENTER (Вместо кнопок на турах) ---
function ContactCenterSection() {
    return (
        <section id="contact-center" className="py-24 bg-gradient-to-t from-amber-950/40 to-slate-950 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-600/20 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-amber-500/30 bg-amber-950/30 backdrop-blur-md mb-6">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Набор в группы открыт</span>
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase">
                    Готовы к <span className="text-amber-500">Приключению?</span>
                </h2>
                
                <p className="text-lg text-slate-300 mb-12 max-w-xl mx-auto">
                    Узнайте расписание ближайших групп, задайте вопросы инструктору и забронируйте место.
                </p>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        
                        {/* Column 1: Messengers */}
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Написать организатору</p>
                            <a href="https://t.me/your_link" target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-[#229ED9] hover:bg-[#1f91c7] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[#229ED9]/30">
                                <MessageCircle size={20} /> Telegram
                            </a>
                            <a href="https://wa.me/your_number" target="_blank" className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-[#25D366]/30">
                                <PhoneCall size={20} /> WhatsApp
                            </a>
                        </div>

                        {/* Column 2: Direct Call or Info */}
                        <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-8">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-amber-500">
                                <Phone size={28} />
                            </div>
                            <p className="text-slate-400 text-sm mb-2">Живой звонок</p>
                            <a href="tel:+37300000000" className="text-2xl font-black text-white hover:text-amber-500 transition-colors">
                                +373 777 00 000
                            </a>
                            <p className="text-slate-600 text-xs mt-4">Отвечаем с 9:00 до 20:00</p>
                        </div>

                    </div>
                </div>

                <p className="mt-8 text-slate-500 text-sm">
                    Мест в группах обычно мало (до 12 чел). Лучше бронировать заранее.
                </p>
            </div>
        </section>
    )
}