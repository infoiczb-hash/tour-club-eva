'use client';

// src/app/active-rest/ActiveRestClient.tsx
// 10 секций: Hero → Статистика → Почему → Активности → Места → Маршруты →
//            Сезонность → Туры → Как добраться → FAQ

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves, Mountain, Compass, Baby, MapPin, ChevronDown,
  ArrowRight, Calendar, Phone, MessageCircle, Anchor,
  Navigation, Tent, ExternalLink, Clock, Footprints,
  Bike, Map, Users, Star,
} from 'lucide-react';
import TourCard from '@/features/tours/components/TourCard';
import ContactHubModal from '@/components/modals/ContactHubModal';
import { Tour } from '@/features/tours/types';

// ─── cn helper ───────────────────────────────────────────────────────────────
function cn(...cls: (string | undefined | false | null)[]) {
  return cls.filter(Boolean).join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ДАННЫЕ
// ═══════════════════════════════════════════════════════════════════════════════

const STATS = [
  { value: '6', suffix: 'лет', label: 'на Днестре' },
  { value: '150', suffix: '+', label: 'туров проведено' },
  { value: '12', unit: 'тыс', suffix: '', label: 'туристов в год в ПМР' },
  { value: '4', suffix: ' мес', label: 'активный сезон' },
  { value: '30', suffix: ' мин', label: 'от Тирасполя до старта' },
];

const WHY_CARDS = [
  {
    icon: Waves,
    title: 'Река Днестр',
    desc: 'Самая извилистая река Европы. Каньоны, скалы, пещерные монастыри — всё это видно прямо с воды или тропы над обрывом.',
  },
  {
    icon: Tent,
    title: 'Нетронутая природа',
    desc: 'Единственный заповедник ПМР — Ягорлык. Дикие пляжи Турунчука. Пойменные леса без туристических толп.',
  },
  {
    icon: Navigation,
    title: 'Рядом с домом',
    desc: 'Из Тирасполя до старта — 30–90 минут. Полноценный поход без перелётов, виз и дорогих отелей.',
  },
  {
    icon: Compass,
    title: 'История и уникальность',
    desc: '600-летние сёла, пещерные монастыри, советская эстетика и крепости Османской империи — всё в радиусе 100 км.',
  },
];

const ACTIVITIES = [
  {
    icon: Waves,
    title: 'Сплавы на байдарках',
    subtitle: 'По реке Днестр',
    desc: 'Однодневные и многодневные сплавы. Каньоны, дикие пляжи, костёр у воды. Без опыта — с нуля.',
    href: '/directions/kayaking',
    linkText: 'Сплавы на байдарках по Днестру',
    accent: '#14b8a6',
    hoverBorder: 'hover:border-teal-500/40',
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp',
  },
  {
    icon: Anchor,
    title: 'SUP-прогулки',
    subtitle: 'На сапборде',
    desc: 'Встаньте на доску и плывите. Обучение за 15 минут. Подходит всем — от 6 до 60 лет.',
    href: '/directions/sup',
    linkText: 'SUP-прогулки в Приднестровье',
    accent: '#06b6d4',
    hoverBorder: 'hover:border-cyan-500/40',
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674650/sup_zwz9yw.webp',
  },
  {
    icon: Mountain,
    title: 'Пешие маршруты',
    subtitle: 'Цыпово, Рашков, Строенцы',
    desc: 'От лёгких прогулок до серьёзных однодневок. Скалы над Днестром, пещерные монастыри, лесные тропы.',
    href: '/directions/hiking',
    linkText: 'Пешие маршруты по Приднестровью',
    accent: '#10b981',
    hoverBorder: 'hover:border-emerald-500/40',
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp',
  },
  {
    icon: Baby,
    title: 'Детские лагеря',
    subtitle: 'С 6 лет',
    desc: 'Природный лагерь с ночёвкой: байдарки, костёр, ориентирование. Дети в безопасности, родители отдыхают.',
    href: '/directions/kids',
    linkText: 'Детские лагеря в Приднестровье',
    accent: '#f59e0b',
    hoverBorder: 'hover:border-amber-500/40',
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674646/kids_e7lr51.webp',
  },
  {
    icon: Compass,
    title: 'Местные маршруты',
    subtitle: 'Экскурсии по ПМР',
    desc: 'Крепости, исторические сёла, заповедник Ягорлык. Для тех кто хочет открыть регион изнутри.',
    href: '/directions/local',
    linkText: 'Экскурсии и маршруты по ПМР',
    accent: '#34d399',
    hoverBorder: 'hover:border-emerald-400/40',
    image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674647/local_i9ul0e.webp',
  },
];

const PLACES = [
  {
    name: 'Рашков',
    tag: 'Пешие маршруты',
    tagColor: '#10b981',
    desc: 'Старейшее село Приднестровья — 600+ лет. Известняковые скалы, карстовые гроты, ущелья. Три религии в одном месте: православная церковь XVIII в., католический костёл и руины синагоги.',
    href: '/directions/hiking',
    external: false,
    activity: 'Поход + байдарки',
  },
  {
    name: 'Цыпово',
    tag: 'Пешие маршруты',
    tagColor: '#10b981',
    desc: 'Пещерный монастырь прямо в скале над Днестром. Один из самых живописных маршрутов региона — тропа по кромке обрыва с видом на реку.',
    href: '/directions/hiking',
    external: false,
    activity: 'Поход',
  },
  {
    name: 'Строенцы',
    tag: 'Пешие маршруты',
    tagColor: '#10b981',
    desc: 'Башня ветров XIX века на вершине скалы, 9 одновременно бьющих источников, водяная мельница и каскадные водопады. Один из самых недооценённых маршрутов ПМР.',
    href: '/directions/hiking',
    external: false,
    activity: 'Поход',
  },
  {
    name: 'Заповедник Ягорлык',
    tag: 'Экотуризм',
    tagColor: '#34d399',
    desc: 'Единственный заповедник Приднестровья. Залив с пойменным лесом, советские скульптуры в кустах, кабаны, ландшафты как в горном Крыму. Смотровая вышка над заливом.',
    href: '/directions/local',
    external: false,
    activity: 'Экскурсия',
  },
  {
    name: 'Турунчук',
    tag: 'Водные маршруты',
    tagColor: '#14b8a6',
    desc: 'Рукав Днестра с каменным порогом и дикими песчаными пляжами. Мекка для байдарок, SUP и рыбалки. Пойменные ивовые леса, почти полное отсутствие людей в будни.',
    href: '/directions/kayaking',
    external: false,
    activity: 'Байдарки + SUP',
  },
  {
    name: 'Каменка',
    tag: 'Местные туры',
    tagColor: '#34d399',
    desc: 'Виноградники на скалистых террасах над Днестром, санаторий XIX века, приусадебный парк. Курортный городок с историей — первый виноградолечебный курорт юго-западной России.',
    href: '/directions/local',
    external: false,
    activity: 'Экскурсия',
  },
  {
    name: 'Кицканы',
    tag: 'Местные туры',
    tagColor: '#34d399',
    desc: 'Свято-Вознесенский монастырь XIX века + Кицканский плацдарм с лучшей смотровой точкой региона. Отсюда открывается вид сразу на Тирасполь, Бендеры, Днестр и пойменные леса.',
    href: '/directions/local',
    external: false,
    activity: 'Экскурсия',
  },
  {
    name: 'Бендерская крепость',
    tag: 'История',
    tagColor: '#8b5cf6',
    desc: 'Крепость XVI века постройки по проекту турецкого зодчего Синана. Музей истории, средневековые орудия, панорама Днестра. Один из немногих хорошо сохранившихся османских фортов в регионе.',
    href: '/directions/local',
    external: false,
    activity: 'Экскурсия',
  },
];

const ROUTES = [
  {
    name: 'Рашков — скалы и гроты',
    type: 'Пеший',
    icon: Footprints,
    distance: '~5 км',
    duration: '3–4 часа',
    difficulty: 'Лёгкий',
    diffColor: '#10b981',
    source: 'Wikiloc',
    sourceIcon: '🗺',
    href: 'https://www.wikiloc.com/trails/hiking/moldova',
    isExternal: true,
    desc: 'Тропа над Днестром с видом на 600-летнее село, через известняковые гроты и ущелья.',
  },
  {
    name: 'Строенцы — Башня ветров',
    type: 'Пеший',
    icon: Footprints,
    distance: '~4 км',
    duration: '2–3 часа',
    difficulty: 'Лёгкий',
    diffColor: '#10b981',
    source: 'Wikiloc',
    sourceIcon: '🗺',
    href: 'https://www.wikiloc.com/trails/hiking/moldova',
    isExternal: true,
    desc: 'Через виноградники на обзорную площадку к башне, вниз к 9 источникам и мельнице.',
  },
  {
    name: 'Цыпово — пещерный монастырь',
    type: 'Пеший',
    icon: Footprints,
    distance: '~6 км',
    duration: '4–5 часов',
    difficulty: 'Средний',
    diffColor: '#f59e0b',
    source: 'ЭВА',
    sourceIcon: '⛵',
    href: '/directions/hiking',
    isExternal: false,
    desc: 'Маршрут по кромке скалы с видом на Днестр, спуск к пещерному монастырю XII века.',
  },
  {
    name: 'Рыбница → Каменка по воде',
    type: 'Байдарки',
    icon: Waves,
    distance: '~25 км',
    duration: '1 день',
    difficulty: 'Лёгкий',
    diffColor: '#10b981',
    source: 'ЭВА',
    sourceIcon: '⛵',
    href: '/directions/kayaking',
    isExternal: false,
    desc: 'Однодневный сплав через самые красивые места севера Приднестровья. Ночёвка по запросу.',
  },
  {
    name: 'Заповедник Ягорлык',
    type: 'Пеший',
    icon: Footprints,
    distance: '~8 км',
    duration: '4–6 часов',
    difficulty: 'Средний',
    diffColor: '#f59e0b',
    source: 'PMR Tourism',
    sourceIcon: '🏛',
    href: 'https://pridnestrovie-tourism.com',
    isExternal: true,
    desc: 'Заповедные тропы по пойменному лесу, смотровая вышка, встречи с дикими кабанами.',
  },
  {
    name: 'Турунчук — рукав Днестра',
    type: 'SUP / Байдарки',
    icon: Anchor,
    distance: '~15 км',
    duration: 'Полдня',
    difficulty: 'Лёгкий',
    diffColor: '#10b981',
    source: 'ЭВА',
    sourceIcon: '⛵',
    href: '/directions/kayaking',
    isExternal: false,
    desc: 'Тихий рукав с каменным порогом, дикими пляжами и почти полным отсутствием людей.',
  },
];

// Комбо-маршруты
const COMBOS = [
  {
    label: 'За день',
    title: 'Цыпово + сплав обратно',
    points: ['Тирасполь → Цыпово (машина)', 'Пещерный монастырь (2 ч)', 'Сплав на байдарках вниз по Днестру (4 ч)', 'Возврат в Тирасполь'],
    tag: 'Байдарки + Поход',
    color: '#14b8a6',
  },
  {
    label: 'Выходные',
    title: 'Рашков → Строенцы',
    points: ['День 1: Рашков — скалы, гроты, ночёвка у реки', 'День 2: Строенцы — Башня ветров, 9 источников', 'Необязательно: сплав между сёлами'],
    tag: 'Поход + Кемпинг',
    color: '#10b981',
  },
  {
    label: '5 дней',
    title: 'Экспедиция по ПМР',
    points: ['День 1–2: Сплав Рыбница → Каменка', 'День 3: Заповедник Ягорлык', 'День 4: Рашков — скалы и история', 'День 5: Цыпово + Тирасполь'],
    tag: 'Экспедиция',
    color: '#8b5cf6',
  },
];

const SEASONS = [
  { month: 'Апр', score: 3, best: ['Пешие маршруты', 'Местные туры'] },
  { month: 'Май', score: 5, best: ['SUP', 'Байдарки', 'Пешие'] },
  { month: 'Июн', score: 5, best: ['Байдарки', 'Детские лагеря', 'SUP'] },
  { month: 'Июл', score: 4, best: ['SUP', 'Детские лагеря', 'Байдарки'] },
  { month: 'Авг', score: 5, best: ['Байдарки', 'SUP', 'Детские лагеря'] },
  { month: 'Сен', score: 5, best: ['Пешие', 'Байдарки', 'Местные туры'] },
  { month: 'Окт', score: 3, best: ['Пешие маршруты', 'Местные туры'] },
];

const FAQ_ITEMS = [
  { q: 'Нужна ли виза для въезда в Приднестровье?', a: 'Виза не нужна. Граждане Молдовы и России — по внутреннему паспорту. Граждане других стран — по загранпаспорту. Пограничный контроль есть, но он формальный и занимает 5–15 минут.' },
  { q: 'Нужна ли физическая подготовка для сплава?', a: 'Нет. Все наши туры адаптированы для новичков. Инструктор проведёт briefing на старте — через 20 минут вы уверенно гребёте самостоятельно. Главное — желание.' },
  { q: 'С какого возраста можно участвовать?', a: 'На байдарках и SUP — с 6 лет в сопровождении родителей. Детские лагеря — 6–14 лет. Пешие маршруты — с 8 лет для лёгких, с 12 для сложных. Верхнего предела нет.' },
  { q: 'Что включено в стоимость тура?', a: 'Инструктор, снаряжение (байдарки, спасжилеты, вёсла), транспорт к старту. В многодневных турах — лагерь, еда, тент. Детально — на странице конкретного тура.' },
  { q: 'Есть ли в Приднестровье пляжи?', a: 'Да. На участке Бендеры–Чобручи вдоль Днестра несколько хороших речных пляжей с мелким песком. Особенно — в районе Турунчука, Терновки, Суклеи. В сезон там почти безлюдно.' },
  { q: 'Нужно ли разрешение для посещения заповедника Ягорлык?', a: 'Для самостоятельного посещения нужна договорённость со смотрителями заповедника. Мы организуем это автоматически в составе тура.' },
  { q: 'Можно ли совместить Приднестровье и Молдову за одну поездку?', a: 'Да, отлично совмещается. Популярный маршрут: Старый Орхей (Молдова) + Цыпово (ПМР) за два дня. Граница простая, переходится за 15 минут.' },
  { q: 'Как добраться из России в 2025 году?', a: 'Прямых рейсов нет. Через Кишинёв: перелёт Москва–Кишинёв, затем маршрутка или такси до Тирасполя (1 час). Через Одессу — аналогично. Пишите нам — поможем спланировать логистику.' },
  { q: 'Какой лучший сезон для активного отдыха?', a: 'Май–июнь и август–сентябрь — оптимально. Тепло, не жарко, вода хорошая. Июль подходит для водных активностей, но жарче. Апрель и октябрь — для пеших маршрутов.' },
  { q: 'Есть ли глэмпинг или комфортная ночёвка у реки?', a: 'У нас есть оборудованные лагеря с тентами, спальниками и кухней. Глэмпинга в европейском смысле пока нет в регионе — но мы делаем ночёвки максимально комфортными для новичков.' },
  { q: 'Можно ли приехать с собакой?', a: 'На большинство наших туров — да. Уточняйте при бронировании: для собак крупных пород есть ограничения на многодневных сплавах.' },
];

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────────
function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-900/50 transition-colors">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left group focus:outline-none">
            <span className="font-bold text-sm md:text-base text-slate-200 group-hover:text-white transition-colors pr-4">{item.q}</span>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300', open === i ? 'rotate-180 bg-teal-900/30 text-teal-400' : 'bg-slate-800 text-slate-400')}>
              <ChevronDown size={18} />
            </div>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="border-t border-slate-800">
                <p className="px-5 py-4 text-sm md:text-base text-slate-400 leading-relaxed">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, accent }: { eyebrow: string; title: React.ReactNode; accent?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 md:mb-16">
      <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">{eyebrow}</p>
      <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[1.05]">{title}</h2>
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ActiveRestClient({ tours }: { tours: Tour[] }) {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[95svh] flex items-end pb-20 overflow-hidden bg-slate-950">
        {/* Фон */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp"
            alt="Туризм в Приднестровье — сплав по реке Днестр"
            fill priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
        </div>
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 70%, rgba(20,184,166,0.5) 0%, transparent 55%)' }} />

        <div className="container relative z-10 mx-auto px-5 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            {/* Бейджи */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['🏕 Природа', '🏛 История', '🚣 Река Днестр'].map((b) => (
                <span key={b} className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-bold">{b}</span>
              ))}
            </div>

            {/* H1 */}
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white uppercase tracking-tighter leading-[0.88] mb-6">
              Куда поехать<br />
              в <span className="text-teal-400">Придне-<br className="hidden sm:block" />стровье</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed mb-10">
              Активный отдых, маршруты по Днестру, исторические сёла и природные заповедники —
              всё в 30–90 минутах от Тирасполя. С апреля по октябрь.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tour" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(20,184,166,0.35)]">
                <Calendar size={18} /> Смотреть туры
              </Link>
              <button onClick={() => setIsContactOpen(true)} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all">
                <Phone size={18} /> Задать вопрос
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. СТАТИСТИКА (узкая полоса)
      ══════════════════════════════════════════ */}
      <div className="bg-slate-900 border-y border-white/5">
        <div className="container mx-auto px-5 max-w-6xl py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-4">
            {STATS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex flex-col items-center text-center">
                <div className="text-3xl font-black text-white leading-none">
                  {s.value}<span className="text-teal-400 text-xl">{s.suffix}</span>
                  {s.unit && <span className="text-teal-400 text-base ml-0.5">{s.unit}</span>}
                </div>
                <div className="text-slate-500 text-xs font-medium mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3. ПОЧЕМУ ПРИДНЕСТРОВЬЕ
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-950">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Почему здесь"
            title={<>Приднестровье —<br /><span className="text-teal-400">незаезженное</span> место</>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_CARDS.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-6 hover:border-teal-900/50 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-teal-900/30 flex items-center justify-center mb-4">
                  <c.icon size={22} className="text-teal-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. 5 АКТИВНОСТЕЙ
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Чем заняться"
            title={<>5 видов<br /><span className="text-teal-400">активного туризма</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACTIVITIES.map((act, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={cn('group relative overflow-hidden rounded-[1.5rem] border-2 border-white/5 bg-slate-900 transition-all duration-300', act.hoverBorder)}>
                <div className="relative h-44 overflow-hidden">
                  <Image src={act.image} alt={`${act.title} в Приднестровье`} fill
                    className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, transparent 60%)' }} />
                  <div className="absolute top-4 left-4 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20" style={{ background: `${act.accent}22` }}>
                    <act.icon size={18} style={{ color: act.accent }} />
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: act.accent }}>{act.subtitle}</p>
                  <h3 className="text-lg font-black text-white mb-2">{act.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{act.desc}</p>
                  <Link href={act.href} className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors group/link" style={{ color: act.accent }}>
                    {act.linkText} <ArrowRight size={15} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. КОНКРЕТНЫЕ МЕСТА
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Куда ехать"
            title={<>8 мест<br /><span className="text-teal-400">Приднестровья</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLACES.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.08 }}
                className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] p-5 hover:border-slate-700 transition-colors flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-black text-white">{p.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border shrink-0" style={{ color: p.tagColor, borderColor: `${p.tagColor}40`, background: `${p.tagColor}15` }}>
                    {p.tag}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed flex-1 mb-4">{p.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{p.activity}</span>
                  <Link href={p.href} className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                    Туры <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. МАРШРУТЫ (своими + внешние ссылки)
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">GPS-треки и описания</p>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                Маршруты<br /><span className="text-teal-400">по Приднестровью</span>
              </h2>
            </div>
            <p className="text-slate-500 text-sm max-w-xs md:text-right leading-relaxed">
              Собственные треки ЭВА и проверенные маршруты с Wikiloc и официального портала туризма ПМР
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROUTES.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.1 }}
                className="group bg-slate-900/60 border border-slate-800 rounded-[1.5rem] p-5 hover:border-teal-900/50 transition-colors flex flex-col">

                {/* Шапка */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-900/30 flex items-center justify-center shrink-0">
                    <r.icon size={18} className="text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white leading-tight">{r.name}</h3>
                    <span className="text-xs font-bold" style={{ color: r.diffColor }}>{r.difficulty}</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed flex-1 mb-4">{r.desc}</p>

                {/* Мета */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
                  <span className="flex items-center gap-1"><Map size={11} />{r.distance}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{r.duration}</span>
                  <span className="flex items-center gap-1"><r.icon size={11} />{r.type}</span>
                </div>

                {/* Источник + ссылка */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-600 font-bold">{r.sourceIcon} {r.source}</span>
                  {r.isExternal ? (
                    <a href={r.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors">
                      Открыть <ExternalLink size={11} />
                    </a>
                  ) : (
                    <Link href={r.href} className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                      Записаться <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Лейбл */}
          <p className="mt-6 text-xs text-slate-600 text-center">
            ⛵ — маршруты ЭВА, с инструктором и снаряжением &nbsp;·&nbsp; 🗺 — треки Wikiloc, для самостоятельного похода &nbsp;·&nbsp; 🏛 — официальный портал туризма ПМР
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. КОМБО-МАРШРУТЫ
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-24 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Готовые сценарии"
            title={<>На день,<br /><span className="text-teal-400">выходные или неделю</span></>}
          />
          <div className="grid md:grid-cols-3 gap-5">
            {COMBOS.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] p-6 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border" style={{ color: c.color, borderColor: `${c.color}50`, background: `${c.color}15` }}>
                    {c.label}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">{c.tag}</span>
                </div>
                <h3 className="text-lg font-black text-white mb-4">{c.title}</h3>
                <ol className="space-y-2">
                  {c.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-slate-400 text-sm">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5"
                        style={{ background: `${c.color}25`, color: c.color }}>{j + 1}</span>
                      {pt}
                    </li>
                  ))}
                </ol>
                <button onClick={() => setIsContactOpen(true)} className="mt-5 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90 border"
                  style={{ color: c.color, borderColor: `${c.color}40`, background: `${c.color}12` }}>
                  Уточнить даты
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. СЕЗОННОСТЬ
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-24 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Когда ехать"
            title={<>Сезон<br /><span className="text-teal-400">апрель — октябрь</span></>}
          />
          <div className="flex items-end gap-2 mb-8 h-24">
            {SEASONS.map((s, i) => (
              <motion.div key={i} className="flex-1 flex flex-col items-center gap-2"
                initial={{ opacity: 0, scaleY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07, transformOrigin: 'bottom' }}>
                <div className="w-full rounded-t-xl origin-bottom" style={{
                  height: `${(s.score / 5) * 80}px`,
                  background: s.score === 5 ? 'linear-gradient(to top, #14b8a6, #06b6d4)' : s.score === 4 ? '#0f766e' : '#1e3a38'
                }} />
                <span className="text-xs font-bold text-slate-500">{s.month}</span>
              </motion.div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {SEASONS.filter(s => s.score >= 4).map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <div className="w-14 h-14 rounded-xl bg-teal-900/30 flex items-center justify-center shrink-0">
                  <span className="text-xl font-black text-teal-400">{s.month}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.best.map(b => (
                    <span key={b} className="text-xs font-bold px-2.5 py-1 bg-teal-900/30 text-teal-300 rounded-full border border-teal-800/50">{b}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. БЛИЖАЙШИЕ ТУРЫ
      ══════════════════════════════════════════ */}
      {tours.length > 0 && (
        <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
          <div className="container mx-auto px-5 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <SectionHeader
                eyebrow="Записаться"
                title={<>Ближайшие туры<br /><span className="text-teal-400">в Приднестровье</span></>}
              />
              <Link href="/tour" className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors shrink-0 mb-12">
                Все туры <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {tours.map((tour, i) => (
                <motion.div key={tour.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <TourCard tour={tour} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          10. КАК ДОБРАТЬСЯ
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Логистика"
            title={<>Как добраться<br /><span className="text-teal-400">до старта</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { from: 'Тирасполь', time: '30–90 мин', detail: 'Трансфер организуем мы. Сбор в согласованном месте, выезд в составе группы.', badge: 'Трансфер включён', color: 'teal' },
              { from: 'Кишинёв', time: '~1.5 часа', detail: 'Маршрутка Кишинёв → Тирасполь каждые 30 минут (~1 час, ~50 MDL). По запросу встречаем в Тирасполе.', badge: '~1 час от Кишинёва', color: 'slate' },
              { from: 'Одесса', time: '~2.5 часа', detail: 'Прямые маршрутки Одесса → Тирасполь несколько раз в день. Встречаем на вокзале.', badge: '~2 часа от Одессы', color: 'slate' },
              { from: 'Россия', time: 'через Кишинёв', detail: 'Перелёт Москва → Кишинёв, затем маршрутка до Тирасполя. Пишите — поможем спланировать маршрут.', badge: 'Помогаем с маршрутом', color: 'slate' },
            ].map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={cn('rounded-[1.5rem] p-6', i === 0 ? 'bg-teal-950/40 border border-teal-900/50' : 'bg-slate-900/50 border border-slate-800')}>
                <MapPin size={20} className={i === 0 ? 'text-teal-400 mb-4' : 'text-slate-500 mb-4'} />
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Из {d.from}</h3>
                <p className="text-xs font-bold text-teal-400 mb-3">{d.time}</p>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{d.detail}</p>
                <span className={cn('text-xs font-bold', i === 0 ? 'text-teal-400' : 'text-slate-600')}>{d.badge}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          11. FAQ
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-900/8 blur-[150px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-5 max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-start">
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <SectionHeader
                  eyebrow="Ответы"
                  title={<>Частые<br /><span className="text-teal-400">вопросы</span></>}
                />
                <FaqAccordion />
              </motion.div>
            </div>
            <div className="lg:col-span-5">
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden lg:sticky lg:top-24">
                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/8 blur-[50px] rounded-full pointer-events-none" />
                <Users className="w-8 h-8 text-teal-400 mb-5 relative z-10" />
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 text-white relative z-10">
                  Остались<br /><span className="text-teal-400">вопросы?</span>
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">
                  Расскажем о ближайших датах, поможем выбрать тур под ваш уровень и компанию. Отвечаем быстро.
                </p>
                <div className="flex flex-col gap-3 relative z-10">
                  <button onClick={() => setIsContactOpen(true)}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.25)]">
                    <MessageCircle size={18} /> Написать гиду
                  </button>
                  <a href="tel:+37377770141"
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                    <Phone size={18} /> +373 777 70141
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <ContactHubModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} initialTab="TOUR" />
    </>
  );
}
