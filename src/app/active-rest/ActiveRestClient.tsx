'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Waves, Mountain, Compass, MapPin, ChevronDown,
  ArrowRight, Calendar, Phone, MessageCircle, Anchor,
  Navigation, Tent, Clock, Footprints,
  Bike, Map, Users, Star, CreditCard, Globe, Shield,
  Wifi, DollarSign, Info, TreePine, Landmark, Camera,
} from 'lucide-react';
import ContactHubModal from '@/components/modals/ContactHubModal';
import { useInView } from '@/hooks/useInView';

function cn(...cls: (string | undefined | false | null)[]) {
  return cls.filter(Boolean).join(' ');
}

//   НАТИВНЫЕ АНИМАЦИИ ВМЕСТО FRAMER MOTION
function FadeIn({ children, delay = 0, x = 0, y = 20, className = '' }: any) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '-30px' });
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0, 0)' : `translate(${x}px, ${y}px)`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

function ScaleYIn({ children, delay = 0, className = '' }: any) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '-30px' });
  return (
    <div
      ref={ref}
      className={cn("origin-bottom transition-all duration-700 ease-out", className)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'scaleY(1)' : 'scaleY(0)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ДАННЫЕ
// ═══════════════════════════════════════════════════════════════════════════════

const PMR_FACTS = [
  { value: '1992', label: 'год провозглашения', icon: Landmark },
  { value: '~4 500', label: 'км² территории', icon: Map },
  { value: '~400 тыс', label: 'жителей', icon: Users },
  { value: '1', label: 'единственный флаг с серпом и молотом', icon: Star },
];

const CHARACTER_CARDS = [
  { icon: Camera, title: 'Живая советская эстетика', desc: 'Не музей и не декорация. Проспекты с Лениным, советские мозаики на стенах, продукты в магазинах без западных брендов — всё это не законсервировано специально, просто так живут.' },
  { icon: TreePine, title: 'Нетронутая природа Днестра', desc: 'Самая извилистая река Европы прорезала известняковые каньоны, пещерные монастыри и пойменные леса. Без туристических толп — пока.' },
  { icon: Landmark, title: 'История трёх цивилизаций', desc: 'Османская крепость, суворовский форпост Российской империи, советская столица — и всё это в радиусе 50 км. Три слоя на одной земле.' },
  { icon: DollarSign, title: 'Один из дешёвых регионов Европы', desc: 'Обед в кафе — €3–4. Вход в музей — €1. Местный коньяк КВИНТ — €5 за бутылку. Регион почти не знает туристической наценки.' },
];

const TIRASPOL_SPOTS = [
  { name: 'Дом Советов', desc: 'Сталинский ампир 1950-х. 200 комнат, четыре этажа, мозаичный Ленин на фасаде. До сих пор работающее здание администрации.', tag: 'Архитектура', color: '#8b5cf6' },
  { name: 'Завод КВИНТ', desc: 'С 1897 года производит коньяки и вина, которые экспортируются в 20+ стран. Экскурсии с дегустацией — одна из главных причин приехать в Тирасполь.', tag: 'Гастро', color: '#f59e0b' },
  { name: 'Мемориал Славы', desc: 'Танк Т-34 на постаменте, вечный огонь, монументы четырёх войн. Место для местных — не для туристов. Именно поэтому стоит зайти.', tag: 'История', color: '#ef4444' },
  { name: 'Центральный рынок', desc: 'Работает 220+ лет. Бабушки с абрикосами и домашним сыром, советские продукты, запахи детства. Лучшее место, чтобы почувствовать город изнутри.', tag: 'Жизнь города', color: '#10b981' },
];

const PLACES = [
  { name: 'Рашков', tag: 'Пешие маршруты', tagColor: '#10b981', desc: 'Старейшее село ПМР — 600+ лет. Известняковые скалы, карстовые гроты. Три религии в одном месте: православная церковь XVIII в., католический костёл, руины синагоги.', href: '/directions/hiking', activity: 'Поход + байдарки' },
  { name: 'Цыпово', tag: 'Пешие маршруты', tagColor: '#10b981', desc: 'Пещерный монастырь прямо в скале над Днестром. XII век. Один из самых живописных маршрутов региона — тропа по кромке обрыва.', href: '/directions/hiking', activity: 'Поход' },
  { name: 'Строенцы', tag: 'Пешие маршруты', tagColor: '#10b981', desc: 'Башня ветров XIX века на вершине скалы, 9 одновременно бьющих источников, водяная мельница, каскадные водопады. Самый недооценённый маршрут ПМР.', href: '/directions/hiking', activity: 'Поход' },
  { name: 'Заповедник Ягорлык', tag: 'Экотуризм', tagColor: '#34d399', desc: 'Единственный заповедник Приднестровья. Пойменный лес, советские скульптуры в зарослях, дикие кабаны, смотровая вышка над заливом.', href: '/directions/local', activity: 'Экскурсия' },
  { name: 'Турунчук', tag: 'Водные маршруты', tagColor: '#14b8a6', desc: 'Рукав Днестра с каменным порогом и дикими песчаными пляжами. Мекка для байдарок и SUP. В будни — почти полное отсутствие людей.', href: '/directions/kayaking', activity: 'Байдарки + SUP' },
  { name: 'Каменка', tag: 'Местные туры', tagColor: '#34d399', desc: 'Виноградники на скалистых террасах над Днестром, санаторий XIX века, приусадебный парк. Первый виноградолечебный курорт юго-западной России.', href: '/directions/local', activity: 'Экскурсия' },
  { name: 'Бендерская крепость', tag: 'История', tagColor: '#8b5cf6', desc: 'Крепость 1538 года постройки по проекту турецкого зодчего Синана. Один из немногих хорошо сохранившихся османских фортов в регионе.', href: '/directions/local', activity: 'Экскурсия' },
  { name: 'Кицканы', tag: 'Местные туры', tagColor: '#34d399', desc: 'Свято-Вознесенский монастырь XIX века + Кицканский плацдарм с лучшей смотровой точкой региона. Вид на Тирасполь, Бендеры, Днестр и пойменные леса.', href: '/directions/local', activity: 'Экскурсия' },
];

const ACTIVITIES = [
  { icon: Waves, title: 'Байдарки', subtitle: 'По реке Днестр', desc: 'Каньоны, дикие пляжи, ночёвки у костра. Маршруты от 4 часов до 5 дней. Опыт не нужен — научиться можно за 20 минут.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp', accent: '#14b8a6', href: '/directions/kayaking' },
  { icon: Anchor, title: 'SUP-бординг', subtitle: 'На сапборде', desc: 'Встать на доску и плыть по Днестру. Подходит всем от 6 до 70. Особенно хорош на Турунчуке — тихий рукав, почти без течения.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674650/sup_zwz9yw.webp', accent: '#06b6d4', href: '/directions/sup' },
  { icon: Mountain, title: 'Пешие маршруты', subtitle: 'Цыпово, Рашков, Строенцы', desc: 'От прогулки с детьми до однодневного похода по скалам над рекой. Лучше всего — май, июнь, сентябрь.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp', accent: '#10b981', href: '/directions/hiking' },
  { icon: Compass, title: 'Экскурсии по ПМР', subtitle: 'История и природа', desc: 'Крепости, монастыри, заповедник, советские мозаики. Для тех, кто хочет понять регион, а не просто пройти по нему.', image: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674647/local_i9ul0e.webp', accent: '#34d399', href: '/directions/local' },
];

const HISTORY_LAYERS = [
  { year: '1538', era: 'Османская империя', title: 'Бендерская крепость', desc: 'Синан — зодчий, построивший мечеть Сулеймание в Стамбуле — спроектировал эту крепость. Она до сих пор стоит.', color: '#f59e0b' },
  { year: '1792', era: 'Российская империя', title: 'Основание Тирасполя', desc: 'Суворов поставил форпост на берегу Днестра. «Тирасполь» — от греческого названия реки: Тирас + полис.', color: '#06b6d4' },
  { year: '1924', era: 'Советский Союз', title: 'Столица МАССР', desc: 'Тирасполь становится столицей Молдавской АССР. Строятся проспекты, заводы, Дом Советов. Этот слой виден лучше всего.', color: '#ef4444' },
  { year: '1992', era: 'Сегодня', title: 'Приднестровская МР', desc: 'После распада СССР — отдельное государство, не признанное ООН. Своя валюта, флаг с серпом и молотом, армия. И двери открыты для туристов.', color: '#10b981' },
];

const VOICES = [
  { quote: 'Я живу в Тирасполе 40 лет. Люди спрашивают — не скучно? Нет. У нас Днестр рядом, лес, рынок. Зачем куда-то ехать?', name: 'Михаил', role: 'Рыбак, Суклея', initial: 'М', color: '#14b8a6' },
  { quote: 'Я приехала из Берлина, ожидала что-то мрачное. А нашла спокойный, зелёный город, где люди здороваются с незнакомыми.', name: 'Anna K.', role: 'Путешественница, Германия', initial: 'A', color: '#8b5cf6' },
  { quote: 'Сплав по Днестру — это не экстрим, это медитация. Скалы, тишина, и понимаешь, что Приднестровье — это не новости по телевизору.', name: 'Дмитрий', role: 'Местный турист, Кишинёв', initial: 'Д', color: '#f59e0b' },
];

const PRACTICAL = [
  { icon: Globe, title: 'Въезд', items: ['Виза не нужна — ни для кого', 'Миграционная карта на границе', 'Стандартно 12 часов (продлевается до 45 дней)', 'Паспорт обязателен'], color: '#10b981' },
  { icon: DollarSign, title: 'Деньги', items: ['Валюта — приднестровский рубль (ПМР)', 'Карты почти не работают — нужна наличка', 'Меняют USD, EUR, MDL повсюду', 'Цены: обед ~€3–4, кофе ~€0.5'], color: '#14b8a6' },
  { icon: Globe, title: 'Язык', items: ['Основной язык — русский', 'Молдавский и украинский понимают', 'Английский — редко, но молодёжь знает', 'Гугл Переводчик работает нормально'], color: '#06b6d4' },
  { icon: Shield, title: 'Безопасность', items: ['Низкий уровень уличной преступности', 'Не фотографировать военные объекты и КПП', 'Полиция относится к туристам нейтрально', 'Страховка — стандартная туристическая'], color: '#f59e0b' },
  { icon: Wifi, title: 'Связь', items: ['Местные SIM — IDC и Интерднестрком', 'Интернет в центре города хороший', 'В природных зонах — слабый сигнал', 'Wi-Fi есть в кафе и отелях'], color: '#8b5cf6' },
  { icon: Navigation, title: 'Жильё', items: ['Отели в Тирасполе от €20/ночь', 'CityClub Hotel — лучший в центре', 'Airbnb не работает, booking.com — да', 'В сёлах — договориться лично'], color: '#ef4444' },
];

const HOW_TO_GET = [
  { from: 'Тирасполь', time: 'Вы на месте', detail: 'Все маршруты начинаются отсюда. До природных старт-точек — 30–90 минут на машине или маршрутке.', badge: 'Столица ПМР', highlight: true },
  { from: 'Кишинёв', time: '~1.5 часа', detail: 'Маршрутка с центрального автовокзала каждые 20–30 минут. ~57 MDL (~€3). Или такси — ~€15.', badge: 'Самый частый маршрут', highlight: false },
  { from: 'Одесса', time: '~3 часа', detail: 'Прямые маршрутки несколько раз в день. Через украинскую границу — стандартный паспортный контроль.', badge: '~2.5 часа пути', highlight: false },
  { from: 'Европа / Россия', time: 'через Кишинёв', detail: 'Перелёт в Кишинёв (Chisinau, KIV), затем маршрутка до Тирасполя. Прямых рейсов в ПМР нет — аэропорт только в Молдове.', badge: 'KIV → Тирасполь', highlight: false },
];

const SEASONS = [
  { month: 'Апр', score: 3, best: ['Пешие маршруты', 'Экскурсии'] },
  { month: 'Май', score: 5, best: ['SUP', 'Байдарки', 'Пешие'] },
  { month: 'Июн', score: 5, best: ['Байдарки', 'Детские лагеря', 'SUP'] },
  { month: 'Июл', score: 4, best: ['SUP', 'Пляж', 'Байдарки'] },
  { month: 'Авг', score: 5, best: ['Байдарки', 'SUP', 'Природа'] },
  { month: 'Сен', score: 5, best: ['Пешие', 'Байдарки', 'Экскурсии'] },
  { month: 'Окт', score: 3, best: ['Пешие маршруты', 'Экскурсии'] },
];

const FAQ_ITEMS = [
  { q: 'Это безопасно — ехать в Приднестровье?', a: 'Да. Уровень уличной преступности низкий, туристов здесь уважают. Главное правило — не фотографировать военные объекты, КПП и пограничников. В остальном — обычная жизнь небольшого города.' },
  { q: 'Нужна ли виза или специальное разрешение?', a: 'Виза не нужна никому. На границе заполняется миграционная карта (бесплатно, 2 минуты). Стандартный срок пребывания — 12 часов, но при желании продлевается в МВД до 45 дней.' },
  { q: 'Какая валюта и можно ли платить картой?', a: 'Официальная валюта — приднестровский рубль (ПМР). Карты Visa/Mastercard почти не принимают — берите наличные USD, EUR или MDL, их меняют везде. Цены очень низкие по европейским меркам.' },
  { q: 'Можно ли совместить Приднестровье и Молдову?', a: 'Отлично совмещается. Популярный маршрут: Старый Орхей (Молдова) + Цыпово (ПМР) — два дня. Граница проходится за 15 минут пешком. Кишинёв — хорошая база для вылазок в ПМР.' },
  { q: 'Нужна ли физическая подготовка для сплава?', a: 'Нет. Все водные маршруты на Днестре адаптированы для новичков. Инструктаж на старте — 20 минут, и вы гребёте самостоятельно. Главное — желание и базовое умение плавать.' },
];

// ─── КОМПОНЕНТЫ ───────────────────────────────────────────────────────────────

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-900/50 transition-colors">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left group focus:outline-none"
          >
            <span className="font-bold text-sm md:text-base text-slate-200 group-hover:text-white transition-colors pr-4">
              {item.q}
            </span>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
              open === i ? 'rotate-180 bg-teal-900/30 text-teal-400' : 'bg-slate-800 text-slate-300'
            )}>
              <ChevronDown size={18} />
            </div>
          </button>
          
          <div className={cn(
              "grid transition-all duration-300 ease-in-out",
              open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}>
            <div className="overflow-hidden">
              <p className="px-5 py-4 text-sm md:text-base text-slate-300 leading-relaxed border-t border-slate-800/50">{item.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) {
  return (
    <FadeIn className="mb-12 md:mb-16">
      <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">{eyebrow}</p>
      <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[1.05]">{title}</h2>
    </FadeIn>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ActiveRestClient() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <>
      {/* 1. HERO */}
      <section className="relative min-h-[95svh] flex items-end pb-20 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tiraspol_city_center.jpg/1280px-Tiraspol_city_center.jpg"
            alt="Тирасполь — столица Приднестровья"
            fill
            priority
            fetchPriority="high"
            className="object-cover opacity-45"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/30 to-transparent" />
        </div>
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 15% 75%, rgba(20,184,166,0.6) 0%, transparent 55%)' }}
        />

        <div className="container relative z-10 mx-auto px-5 max-w-6xl">
          <div className="max-w-3xl">
            <div className="animate-hero-subtitle flex flex-wrap gap-2 mb-6">
              {['🏛 История', '🌿 Природа', '🚣 Днестр', '⚒ Советская эстетика'].map((b) => (
                <span key={b} className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-bold">
                  {b}
                </span>
              ))}
            </div>

            {/*   LCP Fix */}
            <h1 className="animate-hero-title text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white uppercase tracking-tighter leading-[0.88] mb-6">
              Приднестровье —<br />
              <span className="text-teal-400">место вне времени</span>
            </h1>

            <p className="animate-hero-subtitle text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed mb-4">
              Непризнанное государство с серпом и молотом на флаге, советской архитектурой на проспектах
              и диким Днестром за городом. В 90 минутах от Кишинёва. В другом измерении.
            </p>
            <p className="animate-hero-subtitle text-sm text-slate-300 mb-10">Для местных и иностранных туристов · Без визы · Апрель — октябрь</p>

            <div className="animate-hero-subtitle flex flex-col sm:flex-row gap-4">
              <a
                href="#places"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(20,184,166,0.35)]"
              >
                <MapPin size={18} /> Маршруты и места
              </a>
              <a
                href="#practical"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all"
              >
                <Info size={18} /> Практическая информация
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ЧТО ТАКОЕ ПМР */}
      <div className="bg-slate-900 border-y border-white/5">
        <div className="container mx-auto px-5 max-w-6xl py-8">
          <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-6 text-center">Приднестровская Молдавская Республика</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PMR_FACTS.map((f, i) => (
              <FadeIn
                key={i}
                delay={i * 80}
                y={10}
                className="flex flex-col items-center text-center gap-2"
              >
                <f.icon size={20} className="text-teal-400" />
                <div className="text-2xl font-black text-white leading-none">{f.value}</div>
                <div className="text-slate-300 text-xs leading-snug">{f.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ХАРАКТЕР МЕСТА */}
      <section className="py-20 md:py-28 bg-slate-950">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Почему сюда едут"
            title={<>Четыре причины<br /><span className="text-teal-400">открыть ПМР</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {CHARACTER_CARDS.map((c, i) => (
              <FadeIn
                key={i}
                delay={i * 100}
                className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-6 hover:border-teal-900/50 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-900/30 flex items-center justify-center mb-4">
                  <c.icon size={22} className="text-teal-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{c.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{c.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ТИРАСПОЛЬ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <FadeIn x={-20} y={0}>
              <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-3">Столица</p>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[1.05] mb-6">
                Тирасполь —<br /><span className="text-teal-400">как Берлин в 1988,<br />но живой</span>
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Город основан Суворовым в 1792 году. Сегодня здесь 230 тысяч человек, советские проспекты, работающие заводы и рынок, которому 220 лет.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Это не тематический парк и не музей. Люди живут — ходят на работу, пьют кофе, играют в футбол. Именно это и интересно.
              </p>
            </FadeIn>

            <div className="grid grid-cols-2 gap-4">
              {TIRASPOL_SPOTS.map((s, i) => (
                <FadeIn
                  key={i}
                  delay={i * 100}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors"
                >
                  <span
                    className="text-[12px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block"
                    style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}30` }}
                  >
                    {s.tag}
                  </span>
                  <h3 className="text-sm font-black text-white mb-1.5">{s.name}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{s.desc}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. ПРИРОДА И МЕСТА */}
      <section id="places" className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Куда ехать"
            title={<>8 мест<br /><span className="text-teal-400">Приднестровья</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLACES.map((p, i) => (
              <FadeIn
                key={i}
                delay={(i % 4) * 80}
                className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] p-5 hover:border-slate-700 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-black text-white">{p.name}</h3>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full border shrink-0"
                    style={{ color: p.tagColor, borderColor: `${p.tagColor}40`, background: `${p.tagColor}15` }}
                  >
                    {p.tag}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed flex-1 mb-4">{p.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{p.activity}</span>
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Подробнее <ArrowRight size={12} />
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 6. АКТИВНОСТИ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Чем заняться"
            title={<>Активный отдых<br /><span className="text-teal-400">на Днестре</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ACTIVITIES.map((act, i) => (
              <FadeIn
                key={i}
                delay={i * 100}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-slate-900 transition-all duration-300 hover:border-white/10"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={act.image}
                    alt={`${act.title} в Приднестровье`}
                    fill
                    className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, transparent 60%)' }} />
                  <div
                    className="absolute top-4 left-4 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"
                    style={{ background: `${act.accent}22` }}
                  >
                    <act.icon size={18} style={{ color: act.accent }} />
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: act.accent }}>{act.subtitle}</p>
                  <h3 className="text-lg font-black text-white mb-2">{act.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">{act.desc}</p>
                  <Link
                    href={act.href}
                    className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors group/link"
                    style={{ color: act.accent }}
                  >
                    Узнать больше <ArrowRight size={15} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ИСТОРИЯ СЛОЯМИ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5 relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-5"
          style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }}
        />
        <div className="container mx-auto px-5 max-w-6xl relative z-10">
          <SectionHeader
            eyebrow="500 лет истории"
            title={<>Три цивилизации<br /><span className="text-teal-400">на одной земле</span></>}
          />
          <div className="relative">
            <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-slate-800 md:-translate-x-1/2" />
            <div className="space-y-10">
              {HISTORY_LAYERS.map((layer, i) => (
                <FadeIn
                  key={i}
                  delay={i * 150}
                  x={i % 2 === 0 ? -30 : 30}
                  y={0}
                  className={cn(
                    'relative grid md:grid-cols-2 gap-6 pl-14 md:pl-0',
                    i % 2 === 0 ? 'md:pr-[calc(50%+2rem)]' : 'md:pl-[calc(50%+2rem)]'
                  )}
                >
                  <div
                    className="absolute left-3 md:left-1/2 top-1 w-4 h-4 rounded-full border-2 border-slate-950 md:-translate-x-1/2 z-10"
                    style={{ background: layer.color }}
                  />
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-black" style={{ color: layer.color }}>{layer.year}</span>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ color: layer.color, background: `${layer.color}18` }}
                      >
                        {layer.era}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white mb-2">{layer.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{layer.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. ГОЛОСА */}
      <section className="py-20 md:py-24 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Люди о регионе"
            title={<>Что говорят<br /><span className="text-teal-400">те, кто был здесь</span></>}
          />
          <div className="grid md:grid-cols-3 gap-6">
            {VOICES.map((v, i) => (
              <FadeIn
                key={i}
                delay={i * 120}
                className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] p-6 flex flex-col gap-5"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                  style={{ background: `${v.color}20`, color: v.color }}
                >
                  {v.initial}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 italic">«{v.quote}»</p>
                <div>
                  <p className="text-white text-sm font-bold">{v.name}</p>
                  <p className="text-slate-300 text-xs">{v.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 9. ПРАКТИКА */}
      <section id="practical" className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Перед поездкой"
            title={<>Всё что нужно<br /><span className="text-teal-400">знать заранее</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRACTICAL.map((block, i) => (
              <FadeIn
                key={i}
                delay={(i % 3) * 100}
                className="bg-slate-900/60 border border-slate-800 rounded-[1.5rem] p-5"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${block.color}20` }}
                >
                  <block.icon size={18} style={{ color: block.color }} />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-3">{block.title}</h3>
                <ul className="space-y-2">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: block.color }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 10. КАК ДОБРАТЬСЯ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Логистика"
            title={<>Как добраться<br /><span className="text-teal-400">до Тирасполя</span></>}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_TO_GET.map((d, i) => (
              <FadeIn
                key={i}
                delay={i * 100}
                className={cn(
                  'rounded-[1.5rem] p-6',
                  d.highlight
                    ? 'bg-teal-950/40 border border-teal-900/50'
                    : 'bg-slate-900/50 border border-slate-800'
                )}
              >
                <MapPin size={20} className={cn('mb-4', d.highlight ? 'text-teal-400' : 'text-slate-300')} />
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Из {d.from}</h3>
                <p className="text-xs font-bold text-teal-400 mb-3">{d.time}</p>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">{d.detail}</p>
                <span className={cn('text-xs font-bold', d.highlight ? 'text-teal-400' : 'text-slate-600')}>
                  {d.badge}
                </span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 11. СЕЗОННОСТЬ */}
      <section className="py-20 md:py-24 bg-slate-950 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-6xl">
          <SectionHeader
            eyebrow="Когда ехать"
            title={<>Сезон<br /><span className="text-teal-400">апрель — октябрь</span></>}
          />
          <div className="flex items-end gap-2 mb-8 h-24">
            {SEASONS.map((s, i) => (
              <ScaleYIn
                key={i}
                delay={i * 70}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-t-xl"
                  style={{
                    height: `${(s.score / 5) * 80}px`,
                    background: s.score === 5
                      ? 'linear-gradient(to top, #14b8a6, #06b6d4)'
                      : s.score === 4 ? '#0f766e' : '#1e3a38',
                  }}
                />
                <span className="text-xs font-bold text-slate-300">{s.month}</span>
              </ScaleYIn>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {SEASONS.filter(s => s.score >= 4).map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-900/30 flex items-center justify-center shrink-0">
                  <span className="text-xl font-black text-teal-400">{s.month}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.best.map(b => (
                    <span
                      key={b}
                      className="text-xs font-bold px-2.5 py-1 bg-teal-900/30 text-teal-300 rounded-full border border-teal-800/50"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FAQ */}
      <section className="py-20 md:py-28 bg-slate-950 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-900/8 blur-[150px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-5 max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-start">
            <div className="lg:col-span-7">
              <SectionHeader
                eyebrow="Ответы"
                title={<>Частые<br /><span className="text-teal-400">вопросы</span></>}
              />
              <FaqAccordion />
            </div>
            <div className="lg:col-span-5">
              <FadeIn x={20} y={0} className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden lg:sticky lg:top-24">
                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/8 blur-[50px] rounded-full pointer-events-none" />
                <Globe className="w-8 h-8 text-teal-400 mb-5 relative z-10" />
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 text-white relative z-10">
                  Остались<br /><span className="text-teal-400">вопросы?</span>
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 relative z-10">
                  Расскажем о маршрутах, поможем спланировать поездку под ваш запрос — один день или неделя. Отвечаем быстро.
                </p>
                <div className="flex flex-col gap-3 relative z-10">
                  <button
                    onClick={() => setIsContactOpen(true)}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                  >
                    <MessageCircle size={18} /> Написать нам
                  </button>
                  <a
                    href="tel:+37377770141"
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={18} /> +373 777 70141
                  </a>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* 13. CTA */}
      <section className="py-16 md:py-20 bg-slate-900 border-t border-white/5">
        <div className="container mx-auto px-5 max-w-3xl text-center">
          <FadeIn>
            <p className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-4">Хочешь увидеть это?</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
              Турклуб «ЭВА» организует<br /><span className="text-teal-400">маршруты по Приднестровью</span>
            </h2>
            <p className="text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto">
              Сплавы по Днестру, пешие маршруты, детские лагеря и экскурсии по региону — с инструктором, снаряжением и трансфером от Тирасполя.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tour"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(20,184,166,0.3)]"
              >
                <Calendar size={18} /> Смотреть туры
              </Link>
              <button
                onClick={() => setIsContactOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider text-sm rounded-2xl transition-all"
              >
                <Phone size={18} /> Задать вопрос
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <ContactHubModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} initialTab="TOUR" />
    </>
  );
}