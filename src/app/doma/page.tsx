import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, Users, BedDouble, Wifi, Flame, Car, 
  CheckCircle2, ChevronLeft, Phone, MessageCircle, 
  Send, Map, Navigation, Info, AlertCircle, 
  Coffee, Trees, ShieldCheck, Clock
} from 'lucide-react';

// === ВЫДУМАННЫЕ ДАННЫЕ ДЛЯ DEMO ===
const HOUSE = {
  title: "А-Фрейм «Лесная Тишина»",
  type: "Дом с ночевкой и баней",
  location: {
    district: "Каменский район",
    village: "с. Строенцы",
    googleMaps: "https://maps.google.com",
    waze: "https://waze.com",
    road: "Асфальт прямо до ворот. Проедет любая машина в любую погоду. Парковка во дворе на 3 авто."
  },
  price: {
    weekdays: "1 500 руб",
    weekends: "2 000 руб",
    deposit: "500 руб (возвращается при выезде)"
  },
  hosts: {
    names: "Анна и Михаил",
    phone: "+373 777 11 222",
    telegram: "https://t.me/your_username",
    whatsapp: "https://wa.me/37377711222",
    hours: "с 09:00 до 21:00",
    season: "Работаем круглый год"
  },
  image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2000&auto=format&fit=crop",
  stats: [
    { icon: Users, label: "Вместимость", value: "до 6 гостей" },
    { icon: BedDouble, label: "Спален", value: "2 спальни" },
    { icon: MapPin, label: "От Тирасполя", value: "120 км" },
  ],
  floorPlan: [
    { floor: "1 этаж", desc: "Кухня-студия, большой стол на 6 человек, санузел с душевой, раскладной диван (2 спальных места)." },
    { floor: "2 этаж (Лофт)", desc: "Две изолированные спальни с двуспальными кроватями (4 спальных места), балкон с видом на лес." }
  ],
  infrastructure: {
    internet: "Оптика 100 Мбит/с (идеально для работы). Связь IDC ловит отлично.",
    shops: "Ближайший продуктовый магазин в 5 минутах на авто. Доставки еды нет."
  },
  packingList: {
    included: ["Постельное белье и полотенца", "Посуда, бокалы, шампуры, казан", "Дрова для камина (1 охапка)", "Мангал и решетки", "Чай, кофе, соль, сахар"],
    bring: ["Питьевая вода (в кране техническая)", "Уголь и розжиг", "Еда и напитки", "Банные тапочки"]
  },
  amenities: [
    { icon: Wifi, label: "Быстрый Wi-Fi" },
    { icon: Flame, label: "Мангальная зона" },
    { icon: Trees, label: "Баня на дровах" },
    { icon: Coffee, label: "Кофемашина" },
    { icon: Car, label: "Парковка (3 авто)" },
  ],
  rules: [
    { label: "Заезд", value: "после 14:00" },
    { label: "Выезд", value: "до 12:00" },
    { label: "Шум", value: "Музыка на улице до 22:00" },
    { label: "Питомцы", value: "Можно с мелкими породами" },
  ],
  description: `
    Идеальное место для побега из города. Наш дом находится на краю хвойного леса. 
    Утром вы просыпаетесь под пение птиц, пьете кофе на террасе с видом на ущелье, 
    а вечером растапливаете баню и жарите мясо на огне. У нас нет глухих заборов — только природа и вы.
  `
};

export default function HouseSamplePage() {
  return (
    <main className="bg-slate-950 min-h-screen pb-24 selection:bg-amber-500/30 selection:text-white font-sans">
      
      {/* === 1. HERO HEADER (Обложка) === */}
      <section className="relative h-[60vh] min-h-[450px] w-full flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src={HOUSE.image} alt={HOUSE.title} fill className="object-cover opacity-60" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pb-10">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl">
            <Link href="#" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-xs font-bold uppercase tracking-widest transition-colors bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <ChevronLeft size={16} /> Каталог домов
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/30 text-[11px] font-black uppercase tracking-widest text-amber-400 mb-4 backdrop-blur-md">
                {HOUSE.type}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase leading-[1.05] tracking-tight mb-4 drop-shadow-2xl">
              {HOUSE.title}
            </h1>
            
            <div className="flex items-center gap-2 text-slate-300 text-sm md:text-base font-medium">
              <MapPin size={18} className="text-amber-500" />
              <span>{HOUSE.location.district}, <span className="text-white font-bold">{HOUSE.location.village}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* === 2. MAIN LAYOUT (Сайдбар слева, Контент справа) === */}
      <div className="container mx-auto px-4 relative z-10 mt-8 md:mt-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* === ЛЕВАЯ КОЛОНКА: СТИКИ-САЙДБАР (Контакты и Конверсия) === */}
          <div className="lg:col-span-4 lg:order-1 relative">
            <div className="sticky top-24 bg-slate-900 border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
               
               {/* Цена */}
               <div className="mb-6 border-b border-white/5 pb-6">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Стоимость аренды</div>
                  <div className="flex items-end gap-2 mb-2">
                     <span className="text-4xl font-black text-white leading-none">{HOUSE.price.weekdays}</span>
                     <span className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">/ сутки (Будни)</span>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Выходные (Пт-Вс): <span className="text-white">{HOUSE.price.weekends}</span></div>
               </div>

               {/* Статус и График */}
               <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     {HOUSE.hosts.season}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                     <Clock size={16} className="text-slate-500" />
                     Звонки и бронь: <span className="text-white">{HOUSE.hosts.hours}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                     <ShieldCheck size={16} className="text-emerald-500" />
                     Прямая связь. Без комиссий.
                  </div>
               </div>

               {/* Кнопки связи */}
               <div className="space-y-3 mb-8">
                  <a href={HOUSE.hosts.telegram} target="_blank" rel="noreferrer" className="w-full py-4 bg-[#2AABEE] hover:bg-[#2298D6] text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                     <Send size={18} /> Написать в Telegram
                  </a>
                  <a href={HOUSE.hosts.whatsapp} target="_blank" rel="noreferrer" className="w-full py-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                     <MessageCircle size={18} /> Написать в WhatsApp
                  </a>
                  <a href={`tel:${HOUSE.hosts.phone.replace(/\s/g, '')}`} className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                     <Phone size={18} /> {HOUSE.hosts.phone}
                  </a>
               </div>

               {/* Навигаторы */}
               <div className="grid grid-cols-2 gap-3 mb-8 border-t border-white/5 pt-6">
                  <a href={HOUSE.location.googleMaps} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-white/5 transition-colors gap-2 group">
                     <Map size={20} className="text-slate-400 group-hover:text-blue-400" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Google Maps</span>
                  </a>
                  <a href={HOUSE.location.waze} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-white/5 transition-colors gap-2 group">
                     <Navigation size={20} className="text-slate-400 group-hover:text-cyan-400" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Waze</span>
                  </a>
               </div>

               {/* Имена владельцев (Футер сайдбара) */}
               <div className="text-center pt-4 border-t border-white/5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ваши хозяева</div>
                  <div className="text-white font-medium">{HOUSE.hosts.names}</div>
               </div>
            </div>
          </div>

          {/* === ПРАВАЯ КОЛОНКА: КОНТЕНТ (Инфо, Инфраструктура) === */}
          <div className="lg:col-span-8 lg:order-2 flex flex-col gap-10 md:gap-14 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            
            {/* Базовые статы */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
               {HOUSE.stats.map((stat, i) => (
                  <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col gap-2">
                     <stat.icon size={24} className="text-amber-500" />
                     <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</div>
                        <div className="text-sm md:text-base font-black text-white">{stat.value}</div>
                     </div>
                  </div>
               ))}
            </div>

            {/* Описание */}
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Об атмосфере</h2>
               <p className="text-slate-300 leading-relaxed font-medium text-sm md:text-base">
                  {HOUSE.description}
               </p>
            </div>

            {/* Планировка и Спальные места */}
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Планировка и спальные места</h2>
               <div className="grid sm:grid-cols-2 gap-4">
                  {HOUSE.floorPlan.map((plan, i) => (
                     <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                        <div className="inline-block px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">
                           {plan.floor}
                        </div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{plan.desc}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* Что брать с собой VS Что есть */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8">
               <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Подготовка к поездке</h2>
               <div className="grid md:grid-cols-2 gap-8">
                  {/* Включено */}
                  <div>
                     <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4 uppercase text-sm tracking-wider">
                        <CheckCircle2 size={18} /> Мы предоставляем:
                     </div>
                     <ul className="space-y-3">
                        {HOUSE.packingList.included.map((item, i) => (
                           <li key={i} className="flex items-start gap-3 text-slate-300 text-sm font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" /> {item}
                           </li>
                        ))}
                     </ul>
                  </div>
                  {/* Взять с собой */}
                  <div>
                     <div className="flex items-center gap-2 text-amber-400 font-bold mb-4 uppercase text-sm tracking-wider">
                        <AlertCircle size={18} /> Нужно взять с собой:
                     </div>
                     <ul className="space-y-3">
                        {HOUSE.packingList.bring.map((item, i) => (
                           <li key={i} className="flex items-start gap-3 text-slate-300 text-sm font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" /> {item}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>

            {/* Дорога, Связь, Магазины */}
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Инфраструктура</h2>
               <div className="space-y-4">
                  <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
                     <Car className="text-amber-500 shrink-0 mt-1" size={24} />
                     <div>
                        <div className="font-bold text-white mb-1">Дорога и парковка</div>
                        <div className="text-sm text-slate-400 font-medium">{HOUSE.location.road}</div>
                     </div>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
                     <Wifi className="text-amber-500 shrink-0 mt-1" size={24} />
                     <div>
                        <div className="font-bold text-white mb-1">Интернет и мобильная связь</div>
                        <div className="text-sm text-slate-400 font-medium">{HOUSE.infrastructure.internet}</div>
                     </div>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
                     <MapPin className="text-amber-500 shrink-0 mt-1" size={24} />
                     <div>
                        <div className="font-bold text-white mb-1">Магазины и доставка</div>
                        <div className="text-sm text-slate-400 font-medium">{HOUSE.infrastructure.shops}</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Удобства (Сетка иконок) */}
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">На территории</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {HOUSE.amenities.map((item, i) => (
                     <div key={i} className="flex items-center gap-3 text-slate-300 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                           <item.icon size={18} />
                        </div>
                        <span className="text-sm font-bold">{item.label}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Правила */}
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Правила дома</h2>
               <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 md:p-8">
                  <ul className="space-y-4">
                     {HOUSE.rules.map((rule, i) => (
                        <li key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/5 pb-4 last:border-0 last:pb-0 gap-1">
                           <span className="text-slate-400 font-medium text-sm flex items-center gap-2">
                              <Info size={14} className="text-slate-600" /> {rule.label}
                           </span>
                           <span className="text-white font-bold text-sm sm:text-right">{rule.value}</span>
                        </li>
                     ))}
                     <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-1">
                           <span className="text-slate-400 font-medium text-sm flex items-center gap-2">
                              <ShieldCheck size={14} className="text-slate-600" /> Залог при заселении
                           </span>
                           <span className="text-white font-bold text-sm sm:text-right">{HOUSE.price.deposit}</span>
                        </li>
                  </ul>
               </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}