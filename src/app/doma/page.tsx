'use client';

// src/app/houses/[slug]/page.tsx
// Один файл — статичное демо. Потом разобьём на Server Component + Client + api.ts
// Приёмы: Airbnb-галерея, sticky sidebar, табы удобств, лайтбокс, похожие объекты

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Users, BedDouble, Wifi, Flame, Car, Bath,
  CheckCircle2, ChevronLeft, Phone, MessageCircle,
  Send, Info, AlertCircle, Coffee, Trees, ShieldCheck,
  Clock, X, ChevronRight, ChevronDown, Bike,
  Utensils, Wind, Baby, Fish, Waves, Zap, Tv,
  ChefHat, Microwave, Refrigerator, WashingMachine,
  Dog, Accessibility, Dumbbell, ParkingSquare,
  Calendar, ArrowRight, Home, Mountain, Landmark,
} from 'lucide-react';

function cn(...cls: (string | undefined | false | null)[]) {
  return cls.filter(Boolean).join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO DATA — заменить на fetch из БД
// ═══════════════════════════════════════════════════════════════════════════════

const HOUSE = {
  slug: 'a-frame-lesnaya-tishina',
  title: 'А-фрейм «Лесная тишина»',
  type: 'Дом с ночёвкой и баней',
  badge: 'Популярный',

  atmosphere: `Утром здесь пахнет хвоей и туманом над рекой. Днём — дымом мангала и смехом на террасе. Вечером — баней, тишиной и звёздным небом без единого городского огня. Мы строили этот дом для людей, которые хотят по-настоящему выдохнуть — не в отеле, а у живого огня, в лесу, рядом с водой.`,

  idealFor: [
    {
      emoji: '🏕',
      title: 'Компания друзей',
      sub: '4–6 чел · баня · мангал · костёр',
    },
    {
      emoji: '👨‍👩‍👧',
      title: 'Семья с детьми',
      sub: 'Детская площадка · безопасно · тихо',
    },
    {
      emoji: '💑',
      title: 'Пара или романтика',
      sub: 'Лофт с видом на лес · уединение · баня',
    },
  ],
  location: {
    district: 'Каменский район',
    village: 'с. Строенцы',
    distanceCity: '120 км от Тирасполя',
    distanceMin: '~90 мин езды',
    googleMaps: 'https://maps.google.com/?q=Stroentsy',
    waze: 'https://waze.com',
    road: 'Асфальт прямо до ворот. Любая машина в любую погоду. Парковка во дворе на 3 авто.',
  },
  price: {
    weekday: 1500,
    weekend: 2000,
    currency: 'руб',
    unit: 'сутки',
    deposit: 500,
    extraGuest: null,
    bath: 800,
    bbq: 300,
  },
  hosts: {
    names: 'Анна и Михаил',
    avatar: 'АМ',
    phone: '+373 777 11 222',
    telegram: 'https://t.me/eva_houses',
    whatsapp: 'https://wa.me/37377711222',
    hours: '09:00 — 21:00',
    season: 'Работаем круглый год',
    responseTime: 'Отвечаем в течение часа',
  },
  images: [
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=800&auto=format&fit=crop',
  ],
  stats: [
    { icon: Users, label: 'Гостей', value: 'до 6' },
    { icon: BedDouble, label: 'Спальни', value: '2' },
    { icon: Home, label: 'Площадь', value: '85 м²' },
    { icon: MapPin, label: 'До города', value: '120 км' },
  ],
  description: `Идеальное место для побега из города. Дом стоит на краю хвойного леса над Днестром — утром просыпаетесь под пение птиц, пьёте кофе на террасе с видом на ущелье, вечером растапливаете баню и жарите мясо на огне.

У нас нет глухих заборов и соседей в ста метрах — только лес, река внизу и звёздное небо. Формат идеален для компании 4–6 человек или семьи с детьми, которая хочет настоящую природу без отказа от комфорта.`,

  floorPlan: [
    {
      floor: '1 этаж',
      desc: 'Кухня-студия, большой стол на 6 человек, санузел с душевой, камин, раскладной диван (2 спальных места). Выход на террасу с мангальной зоной.',
    },
    {
      floor: '2 этаж (лофт)',
      desc: 'Две изолированные спальни с двуспальными кроватями (4 спальных места), балкон с видом на лес. Отдельный санузел.',
    },
  ],

  amenityTabs: [
    {
      id: 'house',
      label: 'В доме',
      items: [
        { icon: Wifi, label: 'Wi-Fi 100 Мбит/с' },
        { icon: Wind, label: 'Кондиционер' },
        { icon: Tv, label: 'Телевизор' },
        { icon: Coffee, label: 'Кофемашина' },
        { icon: Bath, label: 'Душ и ванна' },
        { icon: Refrigerator, label: 'Холодильник' },
        { icon: WashingMachine, label: 'Стиральная машина' },
        { icon: ShieldCheck, label: 'Постельное бельё' },
      ],
    },
    {
      id: 'territory',
      label: 'На территории',
      items: [
        { icon: Trees, label: 'Баня на дровах' },
        { icon: Flame, label: 'Мангальная зона' },
        { icon: Fish, label: 'Рыбалка' },
        { icon: Baby, label: 'Детская площадка' },
        { icon: Dumbbell, label: 'Спортивная площадка' },
        { icon: Waves, label: 'Доступ к реке' },
        { icon: Bike, label: 'Велосипеды (2 шт)' },
        { icon: Dog, label: 'Можно с питомцами' },
      ],
    },
    {
      id: 'kitchen',
      label: 'Кухня и гриль',
      items: [
        { icon: ChefHat, label: 'Полная кухня' },
        { icon: Microwave, label: 'Микроволновка' },
        { icon: Utensils, label: 'Посуда и приборы' },
        { icon: Flame, label: 'Приборы для барбекю' },
        { icon: Coffee, label: 'Чай, кофе, сахар' },
        { icon: ChefHat, label: 'Казан и шампуры' },
      ],
    },
    {
      id: 'parking',
      label: 'Парковка',
      items: [
        { icon: ParkingSquare, label: 'Парковка во дворе (3 авто)' },
        { icon: Car, label: 'Асфальт до ворот' },
        { icon: Zap, label: 'Зарядка электромобилей' },
      ],
    },
  ],

  packingList: {
    included: [
      'Постельное бельё и полотенца',
      'Посуда, бокалы, шампуры, казан',
      'Дрова для камина (1 охапка)',
      'Мангал и решётки',
      'Чай, кофе, соль, сахар',
    ],
    bring: [
      'Питьевая вода (в кране техническая)',
      'Уголь и розжиг',
      'Еда и напитки',
      'Банные тапочки',
    ],
  },

  nearby: [
    {
      icon: Mountain,
      name: 'Башня ветров',
      desc: 'Смотровая площадка XIX века с видом на Днестр',
      distance: '2 км',
      time: '25 мин пешком',
    },
    {
      icon: Waves,
      name: 'Пляж на Днестре',
      desc: 'Дикий песчаный пляж, купание',
      distance: '800 м',
      time: '10 мин пешком',
    },
    {
      icon: Landmark,
      name: 'Пещерный монастырь Цыпово',
      desc: 'XII век, тропа по краю скалы',
      distance: '18 км',
      time: '20 мин на авто',
    },
    {
      icon: Fish,
      name: 'Рыбалка на Днестре',
      desc: 'Карп, щука, сом. Место прямо у дома.',
      distance: 'На территории',
      time: '',
    },
  ],

  food: {
    hasOption: true,
    desc: 'Хозяева могут организовать завтрак (+250 руб/чел) и шашлык под ключ (+500 руб/компания). Запрос за сутки до заезда.',
    shop: 'Ближайший магазин — 5 мин на авто, с. Строенцы. Доставки из города нет.',
  },

  pricing: [
    { label: 'Будни (Пн–Чт)', price: '1 500 руб/сутки' },
    { label: 'Выходные (Пт–Вс)', price: '2 000 руб/сутки' },
    { label: 'Праздники', price: '2 500 руб/сутки' },
    { label: 'Баня (3 часа)', price: '800 руб' },
    { label: 'Барбекю под ключ', price: '300 руб' },
    { label: 'Завтрак', price: '250 руб/чел' },
    { label: 'Залог', price: '500 руб (возврат при выезде)' },
    { label: 'Отмена за 48 ч до заезда', price: 'Полный возврат' },
    { label: 'Отмена менее 48 ч', price: 'Предоплата не возвращается' },
  ],

  rules: [
    { label: 'Заезд', value: 'с 14:00' },
    { label: 'Выезд', value: 'до 12:00' },
    { label: 'Шум на улице', value: 'до 22:00' },
    { label: 'Питомцы', value: 'Можно, мелкие породы' },
    { label: 'Курение', value: 'На улице, в отведённых местах' },
    { label: 'Вечеринки', value: 'Не разрешены' },
  ],

  policy: {
    children: 'Дети любого возраста. Детская кроватка — по запросу бесплатно.',
    booking: 'Бронь подтверждается после предоплаты 30%. Отмена за 48 ч — полный возврат.',
    payment: ['Наличные', 'Перевод на карту', 'IDKARTE ПМР'],
    minStay: 'Минимальный срок — 1 ночь. В праздники — 2 ночи.',
  },

  infrastructure: {
    internet: 'Оптика 100 Мбит/с (IDC). Идеально для удалённой работы.',
    shops: 'Магазин — 5 мин на авто. Доставки из Тирасполя нет.',
    road: 'Асфальт до ворот. Любая машина. Парковка 3 авто.',
  },
};

const SIMILAR_HOUSES = [
  {
    title: 'Домик «У реки»',
    type: 'Гостевой дом',
    location: 'Рашков',
    price: 1200,
    guests: 4,
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=600&auto=format&fit=crop',
    badge: 'С баней',
  },
  {
    title: 'Усадьба «Каменский берег»',
    type: 'Усадьба',
    location: 'Каменка',
    price: 2200,
    guests: 10,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop',
    badge: 'Бассейн',
  },
  {
    title: 'Хостел «Днестр»',
    type: 'Хостел',
    location: 'Тирасполь',
    price: 350,
    guests: 1,
    image: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=600&auto=format&fit=crop',
    badge: null,
  },
];

const REVIEWS = [
  {
    name: 'Дмитрий и Катя',
    city: 'Тирасполь',
    date: 'Август 2024',
    rating: 5,
    text: 'Приехали компанией шестеро. Дом вместил всех с запасом. Баня — огонь в прямом смысле. Хозяева привезли дрова и дали наводку на лучшее место для рыбалки. Вернёмся точно.',
    initials: 'ДК',
    color: 'bg-amber-500/20 text-amber-400',
  },
  {
    name: 'Марина С.',
    city: 'Кишинёв',
    date: 'Июнь 2024',
    rating: 5,
    text: 'Брали на выходные с детьми 4 и 7 лет. Дети не хотели уезжать. Площадка, река, костёр — им хватало занятий весь день. Родители тоже отдохнули: тишина, воздух совершенно другой.',
    initials: 'М',
    color: 'bg-teal-500/20 text-teal-400',
  },
  {
    name: 'Александр',
    city: 'Одесса',
    date: 'Сентябрь 2024',
    rating: 5,
    text: 'Ехали вдвоём на годовщину. Лофт с видом на лес, утренний туман над рекой, баня вечером — это было именно то, что нужно. Анна и Михаил отвечают мгновенно.',
    initials: 'А',
    color: 'bg-violet-500/20 text-violet-400',
  },
];


// ═══════════════════════════════════════════════════════════════════════════════
// КОМПОНЕНТЫ
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose, onPrev, onNext }: {
  images: string[]; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
      >
        <X size={20} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
      >
        <ChevronRight size={24} />
      </button>

      <div className="relative w-full max-w-5xl h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[index]}
          alt={`Фото ${index + 1}`}
          fill
          className="object-contain"
          sizes="90vw"
        />
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}

// ─── PhoneReveal ──────────────────────────────────────────────────────────────
function PhoneReveal({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);
  // Собираем номер из частей — защита от простого парсинга
  const parts = phone.split(' ');

  if (revealed) {
    return (
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        className="w-full py-4 bg-white text-slate-900 font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98]"
      >
        <Phone size={17} /> {phone}
      </a>
    );
  }

  return (
    <button
      onClick={() => setRevealed(true)}
      className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] group"
    >
      <Phone size={17} className="text-amber-400" />
      <span>{parts[0]} {parts[1]} *** ***</span>
      <span className="text-amber-400 text-xs font-black uppercase tracking-wider group-hover:underline">
        Показать
      </span>
    </button>
  );
}

// ─── Airbnb Gallery ───────────────────────────────────────────────────────────
function Gallery({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  return (
    <div className="relative w-full">
      {/* Desktop: Airbnb layout — большое слева + сетка 2×2 справа */}
      <div className="hidden md:grid grid-cols-2 gap-2 h-[520px] rounded-[1.5rem] overflow-hidden">
        {/* Главное фото */}
        <div
          className="relative cursor-pointer group overflow-hidden"
          onClick={() => onOpen(0)}
        >
          <Image
            src={images[0]}
            alt="Главное фото"
            fill
            priority
            fetchPriority="high"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Сетка 2×2 */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {images.slice(1, 5).map((src, i) => (
            <div
              key={i}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => onOpen(i + 1)}
            >
              <Image
                src={src}
                alt={`Фото ${i + 2}`}
                fill
                className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
                sizes="25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
              {/* Кнопка «Все фото» на последней ячейке */}
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
                    onClick={(e) => { e.stopPropagation(); onOpen(4); }}
                  >
                    Все фото (+{images.length - 4})
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: горизонтальный скролл с snap */}
      <div className="md:hidden flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {images.map((src, i) => (
          <div
            key={i}
            className="relative shrink-0 w-[85vw] h-[60vw] rounded-2xl overflow-hidden snap-start cursor-pointer"
            onClick={() => onOpen(i)}
          >
            <Image
              src={src}
              alt={`Фото ${i + 1}`}
              fill
              className="object-cover"
              sizes="85vw"
            />
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {i + 1} / {images.length}
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка «Все фото» на десктопе (внизу справа) */}
      <button
        onClick={() => onOpen(0)}
        className="hidden md:flex absolute bottom-4 right-4 items-center gap-2 px-4 py-2.5 bg-white/95 hover:bg-white text-slate-900 font-bold text-sm rounded-xl transition-all shadow-lg border border-white/20 backdrop-blur-sm"
      >
        Показать все фото
      </button>
    </div>
  );
}

// ─── Amenity Tabs ─────────────────────────────────────────────────────────────
function AmenityTabs({ tabs }: { tabs: typeof HOUSE.amenityTabs }) {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find(t => t.id === active)!;

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 bg-slate-900/60 border border-white/5 rounded-2xl p-1.5 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0',
              active === tab.id
                ? 'bg-amber-500 text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {current.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <item.icon size={16} className="text-amber-400" />
            </div>
            <span className="text-sm font-medium text-slate-300 leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-5 md:mb-6 flex items-center gap-3">
      {children}
    </h2>
  );
}

function Divider() {
  return <div className="border-t border-white/5" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HousePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prevPhoto = () => setLightboxIndex(i => (i - 1 + HOUSE.images.length) % HOUSE.images.length);
  const nextPhoto = () => setLightboxIndex(i => (i + 1) % HOUSE.images.length);

  return (
    <main className="bg-slate-950 min-h-screen pb-28 selection:bg-amber-500/30">

      {/* ══════════════════════════════════════════
          LIGHTBOX
      ══════════════════════════════════════════ */}
      {lightboxOpen && (
        <Lightbox
          images={HOUSE.images}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}

      {/* ══════════════════════════════════════════
          1. BREADCRUMB + ЗАГОЛОВОК
      ══════════════════════════════════════════ */}
      <div className="container mx-auto px-4 max-w-7xl pt-6 pb-4">
        {/* Хлебные крошки */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-5">
          <Link href="/" className="hover:text-white transition-colors">Главная</Link>
          <ChevronRight size={12} />
          <Link href="/houses" className="hover:text-white transition-colors">Каталог домов</Link>
          <ChevronRight size={12} />
          <span className="text-slate-400 truncate">{HOUSE.title}</span>
        </div>

        {/* Заголовок + мета */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            {/* Бейдж типа */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black uppercase tracking-widest">
                {HOUSE.type}
              </span>
              {HOUSE.badge && (
                <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold">
                  {HOUSE.badge}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-[1.05] mb-3">
              {HOUSE.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={14} className="text-slate-400" />
              {HOUSE.location.district}, {HOUSE.location.village}
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{HOUSE.location.distanceMin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. AIRBNB ГАЛЕРЕЯ
      ══════════════════════════════════════════ */}
      <div className="container mx-auto px-4 max-w-7xl mb-8 md:mb-12">
        <Gallery images={HOUSE.images} onOpen={openLightbox} />
      </div>

      {/* ══════════════════════════════════════════
          3. ОСНОВНОЙ LAYOUT: контент + sticky sidebar
      ══════════════════════════════════════════ */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* ──────────────────────────────────────
              ЛЕВАЯ КОЛОНКА — основной контент
          ────────────────────────────────────── */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">

            {/* Ключевые статы */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HOUSE.stats.map((s, i) => (
                <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 hover:border-amber-500/20 transition-colors">
                  <s.icon size={20} className="text-amber-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</div>
                    <div className="text-base font-black text-white">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            {/* Атмосфера места */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/8 rounded-2xl p-6 md:p-8">
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.15em] mb-4">Атмосфера места</div>
              <blockquote className="text-slate-200 text-base md:text-lg leading-relaxed font-medium italic border-l-2 border-amber-500/40 pl-5">
                {HOUSE.atmosphere}
              </blockquote>
              <div className="mt-4 text-slate-300 text-xs">— {HOUSE.hosts.names}, хозяева</div>
            </div>

            {/* Идеально для */}
            <div>
              <SectionTitle>Идеально для</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {HOUSE.idealFor.map((item, i) => (
                  <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 text-center hover:border-amber-500/20 hover:bg-amber-500/5 transition-all">
                    <div className="text-2xl mb-3">{item.emoji}</div>
                    <div className="text-white font-bold text-sm mb-1.5">{item.title}</div>
                    <div className="text-slate-300 text-xs leading-snug">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Описание */}
            <div>
              <SectionTitle>Об объекте</SectionTitle>
              {HOUSE.description.split('\n\n').map((p, i) => (
                <p key={i} className="text-slate-300 leading-relaxed text-sm md:text-base mb-3 last:mb-0">{p.trim()}</p>
              ))}
            </div>

            <Divider />

            {/* Планировка */}
            <div>
              <SectionTitle>Планировка и спальные места</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                {HOUSE.floorPlan.map((plan, i) => (
                  <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                    <div className="inline-block px-2.5 py-1 bg-amber-500/15 rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3">
                      {plan.floor}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{plan.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Удобства — табы */}
            <div>
              <SectionTitle>Удобства</SectionTitle>
              <AmenityTabs tabs={HOUSE.amenityTabs} />
            </div>

            <Divider />

            {/* Подготовка к поездке */}
            <div className="bg-slate-900/60 border border-white/5 rounded-[1.5rem] p-6 md:p-8">
              <SectionTitle>Подготовка к поездке</SectionTitle>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4 text-sm uppercase tracking-wider">
                    <CheckCircle2 size={16} /> Мы предоставляем
                  </div>
                  <ul className="space-y-2.5">
                    {HOUSE.packingList.included.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-4 text-sm uppercase tracking-wider">
                    <AlertCircle size={16} /> Нужно взять с собой
                  </div>
                  <ul className="space-y-2.5">
                    {HOUSE.packingList.bring.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Divider />

            {/* Достопримечательности рядом */}
            <div>
              <SectionTitle>Рядом с домом</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                {HOUSE.nearby.map((place, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <place.icon size={18} className="text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm mb-0.5">{place.name}</div>
                      <div className="text-xs text-slate-400 mb-1">{place.desc}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-400 font-bold">{place.distance}</span>
                        {place.time && <><span className="text-slate-600">·</span><span className="text-slate-400">{place.time}</span></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Питание и напитки */}
            {HOUSE.food.hasOption && (
              <>
                <div>
                  <SectionTitle>Питание и напитки</SectionTitle>
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                        <ChefHat size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm mb-1">Питание под заказ</div>
                        <p className="text-slate-300 text-sm leading-relaxed">{HOUSE.food.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-sm">{HOUSE.food.shop}</p>
                  </div>
                </div>
                <Divider />
              </>
            )}

            {/* Цены */}
            <div>
              <SectionTitle>Цены на услуги</SectionTitle>
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                {HOUSE.pricing.map((row, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between px-5 py-3.5 text-sm',
                      i !== HOUSE.pricing.length - 1 && 'border-b border-white/5',
                      i === 0 && 'bg-amber-500/8'
                    )}
                  >
                    <span className={cn('font-medium', i === 0 ? 'text-white font-bold' : 'text-slate-400')}>
                      {row.label}
                    </span>
                    <span className={cn('font-black', i === 0 ? 'text-amber-400 text-base' : 'text-white')}>
                      {row.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Правила дома */}
            <div>
              <SectionTitle>Правила дома</SectionTitle>
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                {HOUSE.rules.map((rule, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between px-5 py-3.5 text-sm',
                      i !== HOUSE.rules.length - 1 && 'border-b border-white/5'
                    )}
                  >
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Info size={13} className="text-slate-600" />
                      {rule.label}
                    </span>
                    <span className="text-white font-bold text-right">{rule.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Дополнительная информация */}
            <div>
              <SectionTitle>Дополнительная информация</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Baby, title: 'Дети', text: HOUSE.policy.children },
                  { icon: ShieldCheck, title: 'Минимальный срок', text: HOUSE.policy.minStay },
                  {
                    icon: Info,
                    title: 'Способы оплаты',
                    text: HOUSE.policy.payment.join(' · '),
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <item.icon size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                      <p className="text-slate-300 text-xs leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Инфраструктура */}
            <div>
              <SectionTitle>Инфраструктура</SectionTitle>
              <div className="space-y-3">
                {[
                  { icon: Car, title: 'Дорога и парковка', text: HOUSE.infrastructure.road },
                  { icon: Wifi, title: 'Интернет и связь', text: HOUSE.infrastructure.internet },
                  { icon: MapPin, title: 'Магазины', text: HOUSE.infrastructure.shops },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-colors">
                    <item.icon size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                      <div className="text-sm text-slate-400">{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ──────────────────────────────────────
              ПРАВАЯ КОЛОНКА — Sticky Sidebar
          ────────────────────────────────────── */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 space-y-4">

              {/* Карточка бронирования */}
              <div className="bg-slate-900 border border-white/10 rounded-[1.75rem] p-6 shadow-2xl">

                {/* Цена */}
                <div className="mb-5 pb-5 border-b border-white/5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Стоимость аренды</div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-black text-white leading-none">
                      {HOUSE.price.weekday.toLocaleString()}
                    </span>
                    <span className="text-amber-400 font-bold text-sm mb-1">
                      руб / {HOUSE.price.unit}
                    </span>
                  </div>
                  <div className="text-slate-300 text-sm">
                    Выходные (Пт–Вс):{' '}
                    <span className="text-white font-bold">{HOUSE.price.weekend.toLocaleString()} руб</span>
                  </div>
                </div>

                {/* Статус */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    {HOUSE.hosts.season}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Clock size={14} className="text-slate-600 shrink-0" />
                    Звонки: {HOUSE.hosts.hours}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-400">
                    <MessageCircle size={14} className="text-slate-600 shrink-0" />
                    {HOUSE.hosts.responseTime}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-emerald-400 font-medium">
                    <ShieldCheck size={14} className="shrink-0" />
                    Прямая связь. Без комиссий.
                  </div>
                </div>

                {/* CTA кнопки — телефон первичный, соцсети вторичные */}
                <div className="space-y-2.5 mb-6">
                  {/* Телефон — первичный, скрытый до клика */}
                  <PhoneReveal phone={HOUSE.hosts.phone} />

                  {/* Вторичные — мессенджеры */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={HOUSE.hosts.telegram}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 bg-[#2AABEE]/15 hover:bg-[#2AABEE]/25 border border-[#2AABEE]/30 text-[#2AABEE] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Send size={14} /> Telegram
                    </a>
                    <a
                      href={HOUSE.hosts.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>

                {/* Хозяин */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                    {HOUSE.hosts.avatar}
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">Хозяева: {HOUSE.hosts.names}</div>
                    <div className="text-slate-300 text-xs">Прямое бронирование</div>
                  </div>
                </div>
              </div>

              {/* Карта / навигация */}
              <div className="bg-slate-900 border border-white/10 rounded-[1.75rem] p-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Как добраться</div>
                <div className="flex items-start gap-3 mb-4">
                  <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-bold">{HOUSE.location.village}</div>
                    <div className="text-slate-300 text-xs">{HOUSE.location.distanceCity} · {HOUSE.location.distanceMin}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={HOUSE.location.googleMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
                  >
                    <MapPin size={13} /> Google Maps
                  </a>
                  <a
                    href={HOUSE.location.waze}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
                  >
                    <Car size={13} /> Waze
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ОТЗЫВЫ
      ══════════════════════════════════════════ */}
      <div className="container mx-auto px-4 max-w-7xl mt-16 md:mt-20">
        <div className="border-t border-white/5 pt-12">

          {/* Заголовок */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Отзывы гостей
              </h2>
              <p className="text-slate-300 text-sm mt-1">Реальные впечатления — без фильтров</p>
            </div>
          </div>

          {/* Карточки отзывов */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 transition-colors">
                {/* Звёзды */}
                <div className="flex gap-1">
                  {Array.from({ length: r.rating }).map((_, s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 16 16" fill="#f59e0b">
                      <path d="M8 1l1.85 3.75L14 5.5l-3 2.93.7 4.07L8 10.25 4.3 12.5l.7-4.07L2 5.5l4.15-.75z"/>
                    </svg>
                  ))}
                </div>
                {/* Текст */}
                <p className="text-slate-300 text-sm leading-relaxed flex-1">«{r.text}»</p>
                {/* Автор */}
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${r.color}`}>
                    {r.initials}
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">{r.name}</div>
                    <div className="text-slate-300 text-xs">{r.city} · {r.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA — оставить отзыв через токен */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-base mb-1">Вы здесь останавливались?</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Напишите нам в Telegram — мы пришлём персональную ссылку для отзыва.
                Занимает 2 минуты, помогает другим путешественникам.
              </p>
            </div>
            <a
              href="https://t.me/eva_houses?text=Хочу+оставить+отзыв+о+доме+Лесная+тишина"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-[#2AABEE] hover:bg-[#239dd6] text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.02 9.52c-.15.68-.54.84-1.08.52l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.07 5.58-5.04c.24-.22-.05-.34-.38-.12L6.56 14.5 3.6 13.6c-.67-.21-.68-.67.14-.99l11.62-4.48c.56-.2 1.05.14.58 1.06z"/>
              </svg>
              Оставить отзыв
            </a>
          </div>

          {/* Мелкий дисклеймер */}
          <p className="text-slate-600 text-xs mt-4 text-center">
            Отзывы проходят модерацию. Ссылка для отзыва действует 7 дней и одноразовая.
          </p>

        </div>
      </div>

      {/* ══════════════════════════════════════════
          4. ПОХОЖИЕ ОБЪЕКТЫ
      ══════════════════════════════════════════ */}
      <div className="container mx-auto px-4 max-w-7xl mt-16 md:mt-24">
        <div className="border-t border-white/5 pt-12">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
              Похожие<br /><span className="text-amber-400">объекты</span>
            </h2>
            <Link
              href="/houses"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Все объекты <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SIMILAR_HOUSES.map((h, i) => (
              <Link key={i} href="/houses" className="group">
                <div className="bg-slate-900/60 border border-white/5 rounded-[1.5rem] overflow-hidden hover:border-amber-500/20 hover:bg-amber-500/5 transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={h.image}
                      alt={h.title}
                      fill
                      className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {h.badge && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-slate-900 text-xs font-black rounded-lg">
                        {h.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">{h.type}</div>
                    <div className="font-black text-white text-base mb-1">{h.title}</div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin size={12} />
                        <span>{h.location}</span>
                        <span className="text-slate-600">·</span>
                        <Users size={12} />
                        <span>{h.guests}</span>
                      </div>
                      <div className="font-black text-white">
                        {h.price.toLocaleString()}
                        <span className="text-slate-400 font-normal text-xs"> руб</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR
          (только на мобиле — сайдбар скрыт)
      ══════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-white font-black text-xl leading-none">
            {HOUSE.price.weekday.toLocaleString()} <span className="text-amber-400 text-sm font-bold">руб</span>
          </div>
          <div className="text-slate-300 text-xs">будни / сутки</div>
        </div>
        <a
          href={HOUSE.hosts.telegram}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25"
        >
          <Send size={15} /> Забронировать
        </a>
      </div>

    </main>
  );
}
