// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ─── ШРИФТ НА УРОВНЕ МОДУЛЯ ─────────────────────────────────────────────────
// Загружается один раз при холодном старте Edge-контейнера.
const fontPromise: Promise<ArrayBuffer | null> = fetch(
  new URL('/fonts/Montserrat-Black.ttf', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
)
  .then((r) => (r.ok ? r.arrayBuffer() : null))
  .catch(() => null);

// ─── ТИПЫ ───────────────────────────────────────────────────────────────────

type SmmFormat = 'story' | 'feed' | 'post' | 'event';

//   Расширили типы слайдов под нашу воронку
type SlideType = 'logistics' | 'highlights' | 'included' | 'checklist' | 'price' | 'program' | 'default';

interface FontConfig {
  name:   string;
  data:   ArrayBuffer;
  weight: 900;
}

interface OgParams {
  format:         SmmFormat | null;
  type:           string;
  slide:          string;
  slideType:      SlideType;
  slideTitle:     string;
  slideText:      string;
  title:          string;
  currency:       string;
  rawDate:        string;
  imageUrl:       string | null;
  categoryColor:  string;
  categoryTitle:  string;
  trigger:        string | null;
  location:       string;
  duration:       string;
  tags:           string[];
  brandColor:     string;
  formattedDate:  string;
  priceStr:       string;
  priceChildStr:  string;
  priceMemberStr: string;
  priceFamilyStr: string;
  author:         string;
  readTime:       string;
  rubric:         string;
  width:          number;
  height:         number;
  //   НОВЫЕ ПОЛЯ ИЗ ПУЛЬТА
  route:          string | null;
  meetingPoint:   string | null;
  guideName:      string | null;
  spotsLeft:      string | null;
  highlightsRaw:  string | null;
}

// ─── ЦВЕТОВАЯ ПАЛИТРА ───────────────────────────────────────────────────────
export const COLOR_MAP: Record<string, string> = {
  teal:    '#14b8a6',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  emerald: '#10b981',
  violet:  '#8b5cf6',
  blue:    '#3b82f6',
  slate:   '#64748b',
  sky:     '#0ea5e9',
  orange:  '#f97316',
  pink:    '#ec4899',
};

const SIZES: Record<SmmFormat, [number, number]> = {
  story: [1080, 1920],
  post:  [1080, 1080],
  event: [1920, 1005],
  feed:  [1080, 1350],
};

// ─── УТИЛИТЫ ────────────────────────────────────────────────────────────────

/** * БЕСПЛАТНЫЙ ПРОКСИ ДЛЯ WebP: 
 * Оборачиваем прямые ссылки в wsrv.nl, чтобы конвертировать WebP в JPG на лету. 
 * Это спасает Satori от краша "Unsupported image type".
 */
function getSafeImageUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&q=85`;
  }
  return url;
}

/** Форматирует цену с неразрывными пробелями. Невалидный ввод → '' */
export function formatPrice(raw: string | null): string {
  if (!raw || raw.trim() === '') return '';
  const n = Number(raw);
  if (isNaN(n) || n < 0) return '';
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

/** "26 апреля" — защита от UTC-сдвига через T12:00:00 */
export function formatFullDate(raw: string): string {
  if (!raw) return '';
  try {
    const iso = raw.includes('T') ? raw : `${raw}T12:00:00`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const months = [
      'января','февраля','марта','апреля','мая','июня',
      'июля','августа','сентября','октября','ноября','декабря',
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return '';
  }
}

/** Определяет SlideType из явного параметра или по slideTitle */
function resolveSlideType(explicit: string | null, title: string): SlideType {
  //   Обновили массив валидных типов до наших новых
  const VALID: SlideType[] = ['logistics', 'highlights', 'included', 'checklist', 'price', 'program', 'default'];
  if (explicit && VALID.includes(explicit as SlideType)) return explicit as SlideType;
  
  const t = title.toUpperCase();
  //   Обновили fallback-логику, чтобы она узнавала новые заголовки
  if (t.includes('ЛОГИСТИКА') || t.includes('ДЕТАЛИ')) return 'logistics';
  if (t.includes('ПРОГРАММА'))                         return 'program';
  if (t.includes('ВПЕЧАТЛЕНИЯ'))                       return 'highlights';
  if (t.includes('ВКЛЮЧЕНО'))                          return 'included';
  if (t.includes('С СОБОЙ'))                           return 'checklist';
  if (t.includes('СТОИМОСТЬ') || t.includes('ЦЕНА'))   return 'price';
  
  return 'default';
}

/** Валидирует и нормализует все параметры запроса. */
function parseParams(searchParams: URLSearchParams): OgParams {
  const rawFormat = searchParams.get('format');
  const format: SmmFormat | null =
    rawFormat === 'story' || rawFormat === 'feed' || rawFormat === 'post' || rawFormat === 'event'
      ? rawFormat : null;

  const type          = searchParams.get('type')          || 'tour';
  const slide         = searchParams.get('slide')         || '0';
  const slideTitle    = (searchParams.get('slideTitle')   || '').toUpperCase();
  const slideText     = searchParams.get('slideText')     || '';
  const slideType     = resolveSlideType(searchParams.get('slideType'), slideTitle);

  const title         = searchParams.get('title')         || 'Секретный тур';
  const currency      = searchParams.get('currency')      || 'RUB';
  const rawDate       = searchParams.get('date')          || '';
  const imageUrl      = searchParams.get('image')         || null;
  const trigger       = searchParams.get('trigger')       || null;
  const location      = searchParams.get('location')      || 'Локация уточняется';
  const duration      = searchParams.get('duration')      || '';
  const tagsStr       = searchParams.get('tags')          || '';

  // Поля блога
  const author        = searchParams.get('author')        || 'ЭВА';
  const readTime      = searchParams.get('readTime')      || '5'; // убираем "мин" из дефолта, добавим в верстке
  const rubric        = (searchParams.get('rubric')       || 'БЛОГ').toUpperCase();

  // Неизвестный цвет → fallback teal
  const rawColor      = searchParams.get('categoryColor') || 'teal';
  const categoryColor = COLOR_MAP[rawColor] ? rawColor : 'teal';
  const categoryTitle = searchParams.get('categoryTitle') || (type === 'blog' ? 'БЛОГ' : 'ТУР');

  const tags          = tagsStr.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
  const brandColor    = COLOR_MAP[categoryColor]!;
  const formattedDate = formatFullDate(rawDate);

  // Цены
  const priceStr      = formatPrice(searchParams.get('price'));
  const priceChildStr = formatPrice(searchParams.get('priceChild'));
  const priceMemberStr= formatPrice(searchParams.get('priceMember'));
  const priceFamilyStr= formatPrice(searchParams.get('priceFamily'));


const [width, height] = format ? (SIZES[format] ?? [1080, 1350]) : [1080, 1350];

  //   Достаем новые поля для карусели
  const route = searchParams.get('route');
  const meetingPoint = searchParams.get('meetingPoint');
  const guideName = searchParams.get('guideName');
  const spotsLeft = searchParams.get('spotsLeft');
  const highlightsRaw = searchParams.get('highlights');

  return {
    format, type, slide, slideType: searchParams.get('slideType') as SlideType || slideType, slideTitle, slideText,
    title, currency, rawDate, imageUrl, categoryColor, categoryTitle,
    trigger, location, duration, tags, brandColor, formattedDate,
    priceStr, priceChildStr, priceMemberStr, priceFamilyStr,
    author, readTime, rubric,
    width, height,
    route, meetingPoint, guideName, spotsLeft, highlightsRaw //   Отдаем их в рендерер
  };
}

// ─── SVG-ИКОНКИ ─────────────────────────────────────────────────────────────

export const MapPinIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

export const ClockIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

export const CalendarIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);

export const ArrowRightIcon = ({ color, size = 40 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

export const CompassIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
);

export const UserIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const SparklesIcon = ({ color, size = 48 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
);

const CheckIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

// ─── ЖУРНАЛЬНАЯ ВЕРСТКА (АДАПТИВНОСТЬ И GLASSMORPHISM) ──────────────────────

/** 1. Адаптивная система размеров в зависимости от формата */
function getScaleConfig(format: SmmFormat | null) {
  const isStory = format === 'story';
  
  return {
    layoutPadding: isStory ? '100px 60px' : '60px 40px',
    cardPadding: isStory ? '80px 60px' : '60px 40px',
    titleSize: isStory ? '96px' : '82px',      // Гигантские заголовки
    textSize: isStory ? '54px' : '46px',       // Читаемый основной текст
    subTextSize: isStory ? '38px' : '32px',    // Крупные подписи
    iconSize: isStory ? 72 : 60,               // Большие иконки
    gap: isStory ? '50px' : '36px',
    borderRadius: isStory ? '60px' : '44px',
  };
}

/** 2. Премиальная подложка: 100% контрастность для текста */
function MagazineCard({ 
  p, 
  children, 
  align = 'flex-start' 
}: { 
  p: OgParams; 
  children: React.ReactNode; 
  align?: 'flex-start' | 'center';
}) {
  const scale = getScaleConfig(p.format);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
      
      {/* 1. ФОН: Фото с прозрачностью 15% (только намек на текстуру) */}
      {p.imageUrl && (
        <img src={getSafeImageUrl(p.imageUrl)} width={p.width} height={p.height} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />
      )}
      
      {/* 2. ПОДЛОЖКА: Глухой темный цвет для читаемости */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(2, 6, 23, 0.85)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: scale.layoutPadding, position: 'relative', zIndex: 10, justifyContent: 'center' }}>
        
        {/* 3. КОНТЕЙНЕР: Без прозрачности, белый текст на темном */}
        <div style={{
           display: 'flex', 
           flexDirection: 'column',
           alignItems: align,
           backgroundColor: '#0f172a', 
           border: '2px solid rgba(255,255,255,0.1)',
           borderLeft: `20px solid ${p.brandColor}`, // Акцентная полоса
           borderRadius: scale.borderRadius,
           padding: scale.cardPadding,
           boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
           width: '100%'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── ПЕРЕИСПОЛЬЗУЕМЫЕ UI-БЛОКИ ───────────────────────────────────────────────

/** Строка с локацией / длительностью (ДАТА УБРАНА НАВЕРХ) */
function MetaBar({ p, iconSize, fontSize, gap, padding }: { p: OgParams; iconSize: number; fontSize: string; gap: string; padding: string; }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap,
      backgroundColor: 'rgba(15,23,42,0.8)', padding,
      borderRadius: '30px', border: '1px solid rgba(255,255,255,0.15)',
      alignSelf: 'flex-start', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MapPinIcon color={p.brandColor} size={iconSize} />
        <span style={{ color: 'white', fontSize, fontWeight: 900 }}>{p.location}</span>
      </div>
      {p.duration && (
        <>
          <div style={{ width: '2px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClockIcon color={p.brandColor} size={iconSize} />
            <span style={{ color: 'white', fontSize, fontWeight: 900 }}>{p.duration}</span>
          </div>
        </>
      )}
    </div>
  );
}

/** Блок стоимости с плотной подложкой (ЗАЩИТА ОТ ПЕСТРОГО ФОНА) */
function PriceBlock({ p, priceFontSize, currencyFontSize, labelFontSize, badgeFontSize, arrowSize }: { p: OgParams; priceFontSize: string; currencyFontSize: string; labelFontSize: string; badgeFontSize: string; arrowSize: number; }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      padding: '28px 36px',
      borderRadius: '32px',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: labelFontSize, color: 'white', fontWeight: 900,
          textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '3px', opacity: 0.7,
        }}>
          СТОИМОСТЬ ТУРА
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
          <span style={{ fontSize: priceFontSize, color: 'white', fontWeight: 900, lineHeight: 1, textShadow: '0 8px 28px rgba(0,0,0,0.9)' }}>
            {p.priceStr}
          </span>
          <span style={{ fontSize: currencyFontSize, color: p.brandColor, fontWeight: 900, flexShrink: 0 }}>
            {p.currency}
          </span>
        </div>
        {(p.priceChildStr || p.priceMemberStr || p.priceFamilyStr) && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            {p.priceChildStr && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 18px', borderRadius: '16px', fontSize: badgeFontSize, color: '#e2e8f0', fontWeight: 700 }}>
                👶 ДЕТИ {p.priceChildStr}
              </span>
            )}
            {p.priceMemberStr && (
              <span style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)', border: '1px solid #14b8a6', padding: '6px 18px', borderRadius: '16px', fontSize: badgeFontSize, color: '#5eead4', fontWeight: 700 }}>
                👑 КЛУБ {p.priceMemberStr}
              </span>
            )}
            {p.priceFamilyStr && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 18px', borderRadius: '16px', fontSize: badgeFontSize, color: '#e2e8f0', fontWeight: 700 }}>
                👨‍👩‍👧 СЕМЬЯ {p.priceFamilyStr}
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: `${arrowSize}px`, height: `${arrowSize}px`,
        borderRadius: `${arrowSize / 2}px`,
        backgroundColor: p.brandColor,
        boxShadow: `0 10px 40px ${p.brandColor}80`,
        flexShrink: 0, marginLeft: '20px',
      }}>
        <ArrowRightIcon color="#0f172a" size={Math.round(arrowSize * 0.44)} />
      </div>
    </div>
  );
}

// ─── РЕНДЕРЕРЫ СЛАЙДОВ ───────────────────────────────────────────────────────

// 1. СЛАЙД "ЛОГИСТИКА"
function renderLogisticsSlide(p: OgParams) {
  const scale = getScaleConfig(p.format);
  const items = [
    { icon: <MapPinIcon color={p.brandColor} size={scale.iconSize} />, label: 'МЕСТО ВСТРЕЧИ', value: p.meetingPoint || p.location },
    { icon: <ClockIcon color={p.brandColor} size={scale.iconSize} />, label: 'ВРЕМЯ', value: p.duration },
    { icon: <CompassIcon color={p.brandColor} size={scale.iconSize} />, label: 'МАРШРУТ', value: p.route },
    //   ДОБАВЛЕНО: Вывод гида
    { icon: <UserIcon color={p.brandColor} size={scale.iconSize} />, label: 'ГИД', value: p.guideName },
  ].filter(i => i.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <span style={{ fontSize: scale.subTextSize, color: p.brandColor, fontWeight: 900, marginBottom: '24px', letterSpacing: '4px' }}>ЛОГИСТИКА</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: scale.gap }}>
        {items.map((item, i) => (
          //   ДОБАВЛЕНО: Полупрозрачный фон карточки (glassmorphism) и отступы
          <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px 32px' }}>
            <div style={{ display: 'flex', marginRight: '30px' }}>{item.icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              //   ДОБАВЛЕНО: Вывод label
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>{item.label}</span>
              <span style={{ color: 'white', fontSize: scale.textSize, fontWeight: 900, textTransform: 'uppercase' }}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. СЛАЙД "ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ"
function renderHighlightsSlide(p: OgParams) {
  const scale = getScaleConfig(p.format);
  let items: any[] = [];
  try { if (p.highlightsRaw) items = JSON.parse(p.highlightsRaw); } catch (e) {}
  if (!Array.isArray(items) || items.length === 0) return renderDefaultSlide(p);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: scale.gap }}>
        <SparklesIcon color={p.brandColor} size={scale.iconSize} />
        <span style={{ fontSize: scale.titleSize, color: 'white', fontWeight: 900, marginLeft: '24px', textTransform: 'uppercase' }}>{p.slideTitle || 'ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ'}</span>
      </div>
      
     <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        {items.slice(0, 3).map((item, i) => (
          //   ИЗМЕНЕНО: Заменили нижнее подчеркивание на полноценную карточку
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', width: '100%', padding: '32px', backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '30px', flexShrink: 0, marginTop: '4px' }}>
              <CheckIcon color={p.brandColor} size={Math.round(scale.iconSize * 0.9)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span style={{ color: 'white', fontSize: scale.textSize, fontWeight: 900, marginBottom: '12px', lineHeight: 1.2 }}>
                {item.title || 'Впечатление'}
              </span>
              {(item.description || item.desc) && (
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: scale.subTextSize, fontWeight: 600, lineHeight: 1.4 }}>
                  {item.description || item.desc}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. СЛАЙД "ЧТО ВЗЯТЬ С СОБОЙ" / "ВКЛЮЧЕНО" (Чекбоксы с разбивкой по \n)
function renderListSlide(p: OgParams) {
  const scale = getScaleConfig(p.format);
  const lines = p.slideText.split('\n').filter(Boolean);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: scale.gap }}>
         <SparklesIcon color={p.brandColor} size={scale.iconSize} />
         <span style={{ fontSize: scale.titleSize, color: 'white', fontWeight: 900, marginLeft: '24px' }}>{p.slideTitle}</span>
      </div>
     <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {lines.slice(0, 6).map((line, i) => (
          //   ИЗМЕНЕНО: Обернули в карточку, добавили контрастности тексту
          <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '24px 32px', backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckIcon color={p.brandColor} size={Math.round(scale.iconSize * 0.8)} />
            </div>
            <span style={{ color: 'white', fontSize: scale.textSize, fontWeight: 800, marginLeft: '25px', lineHeight: 1.3 }}>
              {line.replace(/^[\u2022\-\*]\s*/, '').trim()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


// 4. СЛАЙД "СТОИМОСТЬ И ЗАПИСЬ"
function renderPriceSlide(p: OgParams) {
  const scale = getScaleConfig(p.format);
  const isStory = p.format === 'story';
  const badgeSize = isStory ? '36px' : '28px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      
      {/* Контент слайда */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: scale.gap }}>
         <span style={{ fontSize: scale.subTextSize, color: '#94a3b8', fontWeight: 900, marginBottom: '10px' }}>СТОИМОСТЬ УЧАСТИЯ</span>
         <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
           <span style={{ fontSize: isStory ? '140px' : '110px', color: 'white', fontWeight: 900 }}>{p.priceStr}</span>
           <span style={{ fontSize: '50px', color: p.brandColor, fontWeight: 900 }}>{p.currency}</span>
         </div>
         
         {/*   ДОБАВЛЕНО: Вывод дополнительных категорий билетов */}
         {(p.priceChildStr || p.priceMemberStr || p.priceFamilyStr) && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            {p.priceChildStr && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: '20px', fontSize: badgeSize, color: '#e2e8f0', fontWeight: 700 }}>
                👶 ДЕТИ {p.priceChildStr} {p.currency}
              </span>
            )}
            {p.priceMemberStr && (
              <span style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)', border: '1px solid #14b8a6', padding: '12px 24px', borderRadius: '20px', fontSize: badgeSize, color: '#5eead4', fontWeight: 700 }}>
                👑 КЛУБ {p.priceMemberStr} {p.currency}
              </span>
            )}
            {p.priceFamilyStr && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: '20px', fontSize: badgeSize, color: '#e2e8f0', fontWeight: 700 }}>
                👨‍👩‍👧 СЕМЬЯ {p.priceFamilyStr} {p.currency}
              </span>
            )}
          </div>
        )}
      </div>

      {p.spotsLeft && (
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px 40px', borderRadius: '20px', marginBottom: scale.gap }}>
          <span style={{ fontSize: scale.textSize, color: 'white', fontWeight: 900 }}>Свободных мест: </span>
          <span style={{ fontSize: scale.textSize, color: p.brandColor, fontWeight: 900, marginLeft: '15px' }}>{p.spotsLeft}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: p.brandColor, borderRadius: '24px', padding: '35px', marginBottom: 'auto' }}>
         <span style={{ fontSize: isStory ? '48px' : '40px', color: '#020617', fontWeight: 900, textTransform: 'uppercase' }}>ЗАПИСАТЬСЯ В ГРУППУ</span>
      </div>

      {/*   ДОБАВЛЕНО: Хардкод-футер, прибитый к низу */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '40px', padding: '24px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}>
        <span style={{ fontSize: isStory ? '32px' : '26px', color: '#94a3b8', fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>
          Билеты на мероприятия по ссылке в шапке профиля<br />или на сайте <span style={{ color: 'white', fontWeight: 800 }}>evatur.club</span>
        </span>
      </div>
    </div>
  );
}

function renderDefaultSlide(p: OgParams) {
  const scale = getScaleConfig(p.format);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
      <span style={{ fontSize: scale.textSize, color: p.brandColor, fontWeight: 900, letterSpacing: '2px', marginBottom: scale.gap, textTransform: 'uppercase' }}>
        {p.slideTitle}
      </span>
      <span style={{ fontSize: scale.titleSize, color: 'white', fontWeight: 900, lineHeight: 1.4 }}>
        {p.slideText}
      </span>
    </div>
  );
}

// ─── РЕНДЕРЕРЫ ФОРМАТОВ ──────────────────────────────────────────────────────

/** Контентные слайды — маршрутизирует по slideType */
function renderSlide(p: OgParams, fontConfig: FontConfig[] | undefined) {
  let content: React.ReactNode;
  switch (p.slideType) {
    case 'logistics':  content = renderLogisticsSlide(p);   break;
    case 'highlights': content = renderHighlightsSlide(p);  break;
    case 'included':   // fall-through
    case 'checklist':  content = renderListSlide(p);        break;
    case 'price':      content = renderPriceSlide(p);       break;
    default:           content = renderDefaultSlide(p);     break;
  }

  return new ImageResponse(
    <MagazineCard p={p}>{content}</MagazineCard>,
    { width: p.width, height: p.height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}

/** Story (1080×1920) — обложка для Instagram Stories */
function renderStory(p: OgParams, fontConfig: FontConfig[] | undefined) {
  const { width, height, brandColor, imageUrl, title, categoryTitle, trigger, tags, type, priceStr, rubric, author, readTime } = p;
  const isBlog = type === 'blog';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
        {imageUrl && (
          <img src={getSafeImageUrl(imageUrl)} width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(2,6,23,0) 0%, rgba(2,6,23,0.15) 35%, rgba(2,6,23,0.75) 60%, rgba(2,6,23,0.97) 100%)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '100px 80px', position: 'relative', zIndex: 10 }}>

          {/* Шапка: Триггер + Категория + Крупная Дата */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {trigger && (
                <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '16px 36px', borderRadius: '100px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(245,158,11,0.5)' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    🔥 {trigger}
                  </span>
                </div>
              )}
             <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.65)', border: `2px solid ${brandColor}`, padding: '18px 40px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: brandColor, marginRight: '18px', boxShadow: `0 0 14px ${brandColor}` }} />
                <span style={{ fontSize: '38px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px' }}>
                  {categoryTitle}
                </span>
              </div>
            </div>
            
            {/* Крупная дата наверху */}
            {!isBlog && p.formattedDate && (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '18px 40px', borderRadius: '100px', gap: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' }}>
                <CalendarIcon color="#0f172a" size={38} />
                <span style={{ fontSize: '38px', fontWeight: 900, color: '#0f172a' }}>{p.formattedDate}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

        {/* Заголовок + теги */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{
              color: 'white',
              // Динамический размер: если букв больше 60, делаем 72px, если больше 35 — 96px, иначе 128px.
              fontSize: isBlog ? (title.length > 60 ? '72px' : title.length > 35 ? '96px' : '128px') : '112px',
              fontWeight: 900, lineHeight: 0.95,
              margin: '0 0 48px 0',
              textTransform: 'uppercase',
              textShadow: '0 8px 32px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.6)',
            }}>
              {title}
            </h1>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
                {tags.map((tag, idx) => (
                  <div key={idx} style={{
                    display: 'flex', backgroundColor: 'rgba(15,23,42,0.65)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '18px 34px', borderRadius: '18px',
                    color: 'white', fontSize: '36px', fontWeight: 900,
                    textTransform: 'uppercase', boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                  }}>
                    # {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

          {/* Нижний блок: Блог vs Тур */}
          {!isBlog ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <MetaBar p={p} iconSize={36} fontSize="38px" gap="24px" padding="26px 40px" />
              {priceStr && <PriceBlock p={p} priceFontSize="84px" currencyFontSize="42px" labelFontSize="32px" badgeFontSize="26px" arrowSize={96} />}
            </div>
          ) : (
           <div style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: 'rgba(15,23,42,0.8)', padding: '24px 40px', borderRadius: '30px', alignSelf: 'flex-start' }}>
               <span style={{ color: brandColor, fontSize: '36px', fontWeight: 900 }}>Автор: {author}</span>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)' }} />
               <span style={{ color: 'white', fontSize: '32px', opacity: 0.8 }}>{readTime} мин. чтения</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}

/** Feed / Post (1080×1350 или 1080×1080) — Адаптивные шрифты */
function renderFeed(p: OgParams, fontConfig: FontConfig[] | undefined) {
  const { width, height, format, brandColor, imageUrl, title, categoryTitle, trigger, tags, type, priceStr, rubric, author, readTime } = p;
  const isPost = format === 'post';
  const isBlog = type === 'blog';

  // Адаптивные шрифты для квадрата
  const titleSize = isBlog ? (isPost ? '72px' : '84px') : (isPost ? '60px' : '76px');
  const pad = isPost ? '40px' : '60px';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
        {imageUrl && (
          <img src={getSafeImageUrl(imageUrl)} width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.25) 30%, rgba(15,23,42,0.82) 65%, rgba(15,23,42,1) 100%)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: pad, position: 'relative', zIndex: 10 }}>

          {/* Шапка */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {trigger && (
                <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '12px 28px', borderRadius: '100px', marginBottom: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.65)', border: `2px solid ${brandColor}`, padding: '14px 32px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '7px', backgroundColor: brandColor, marginRight: '16px', boxShadow: `0 0 12px ${brandColor}` }} />
              <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px' }}>{categoryTitle}</span>
              </div>
            </div>

            {!isBlog && p.formattedDate && (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '14px 32px', borderRadius: '100px', gap: '12px', boxShadow: '0 15px 40px rgba(0,0,0,0.3)' }}>
                <CalendarIcon color="#0f172a" size={28} />
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{p.formattedDate}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

          {/* Заголовок + теги */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{
              color: 'white', fontSize: titleSize, fontWeight: 900, lineHeight: 0.95,
              margin: '0 0 24px 0', textTransform: 'uppercase', textShadow: '0 8px 32px rgba(0,0,0,0.9)',
            }}>
              {title}
            </h1>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                {tags.map((tag, idx) => (
                  <div key={idx} style={{
                    display: 'flex', backgroundColor: 'rgba(15,23,42,0.65)', border: '1px solid rgba(255,255,255,0.18)',
                    padding: '10px 20px', borderRadius: '14px', color: 'white', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase',
                  }}>
                    # {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

          {/* Нижний блок: Блог vs Тур */}
          {!isBlog ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isPost ? '16px' : '28px' }}>
              <MetaBar p={p} iconSize={28} fontSize="28px" gap="20px" padding="20px 30px" />
              {priceStr && <PriceBlock p={p} priceFontSize={isPost ? '64px' : '78px'} currencyFontSize={isPost ? '28px' : '36px'} labelFontSize="24px" badgeFontSize="20px" arrowSize={isPost ? 72 : 84} />}
            </div>
          ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(15,23,42,0.8)', padding: '20px 36px', borderRadius: '30px', alignSelf: 'flex-start' }}>
               <span style={{ color: brandColor, fontSize: '28px', fontWeight: 900 }}>Автор: {author}</span>
               <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)' }} />
               <span style={{ color: 'white', fontSize: '24px', opacity: 0.8 }}>{readTime} мин. чтения</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}

/** Event (1920×1005) — горизонтальный баннер для Facebook Events */
function renderEvent(p: OgParams, fontConfig: FontConfig[] | undefined) {
  const { width, height, brandColor, imageUrl, title, trigger, type, priceStr, formattedDate, location, duration, currency } = p;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#0d131a', fontFamily: 'Montserrat' }}>
        {/* Левая колонка — текст */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '45%', height: '100%', padding: '80px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '20px', flexWrap: 'wrap' }}>
            <MapPinIcon color={brandColor} size={36} />
            <span style={{ color: '#cbd5e1', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase' }}>{location}</span>
            {duration && (
              <>
                <span style={{ color: '#475569', fontSize: '32px' }}>•</span>
                <ClockIcon color={brandColor} size={36} />
                <span style={{ color: '#cbd5e1', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase' }}>{duration}</span>
              </>
            )}
          </div>
          <h1 style={{ color: 'white', fontSize: '88px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 56px 0', textTransform: 'uppercase' }}>
            {title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px', flexWrap: 'wrap' }}>
            {formattedDate && (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', border: `2px solid ${brandColor}`, padding: '22px 36px', borderRadius: '16px' }}>
                <CalendarIcon color={brandColor} size={38} />
                <span style={{ color: 'white', fontSize: '40px', fontWeight: 900, marginLeft: '14px' }}>{formattedDate}</span>
              </div>
            )}
            {priceStr && type !== 'blog' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>СТОИМОСТЬ ТУРА</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '68px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{priceStr}</span>
                  <span style={{ fontSize: '32px', color: brandColor, fontWeight: 900 }}>{currency}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка — изображение */}
        <div style={{ display: 'flex', width: '55%', height: '100%', position: 'relative' }}>
          {imageUrl ? (
            <img src={getSafeImageUrl(imageUrl)} width={1056} height={1005} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#1e293b' }} />
          )}
          {trigger && (
            <div style={{ position: 'absolute', top: '60px', right: '60px', display: 'flex', backgroundColor: '#f43f5e', padding: '20px 40px', borderRadius: '16px', color: 'white', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
              🔥 {trigger}
            </div>
          )}
        </div>
      </div>
    ),
    { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}

/** SEO Open Graph fallback (1200×630) */
function renderSeoFallback(searchParams: URLSearchParams, fontConfig: FontConfig[] | undefined) {
  const seoTitle    = searchParams.get('title')    || 'Туры и сплавы';
  const seoSubtitle = searchParams.get('subtitle') || 'Турклуб ЭВА';

  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', fontFamily: 'Montserrat' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', border: '4px solid #8b5cf6', borderRadius: '30px', backgroundColor: '#0f172a', boxShadow: '0 20px 40px rgba(139,92,246,0.2)' }}>
          <span style={{ fontSize: '40px', color: '#a78bfa', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>{seoSubtitle}</span>
          <span style={{ fontSize: '75px', color: 'white', fontWeight: 900, textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>{seoTitle}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fontConfig }
  );
}

// ─── ГЛАВНЫЙ ОБРАБОТЧИК ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const fontData = await fontPromise;
    const fontConfig: FontConfig[] | undefined = fontData
      ? [{ name: 'Montserrat', data: fontData, weight: 900 }]
      : undefined;

    const p = parseParams(searchParams);

  // 1. ПРОВЕРЯЕМ, ЗАПРОСИЛИ ЛИ МЫ ДИНАМИЧЕСКИЙ СЛАЙД ТУРА ПО ID
    const tourId = searchParams.get('tourId');
    const explicitSlideType = searchParams.get('slideType');

    // ПРИОРИТЕТ: Если SMM-щик прислал отредактированный текст с пульта (slideText), 
    // мы НЕ идем в базу, мы будем рендерить то, что нам прислали.
    const hasManualText = p.slideText && p.slideText.trim().length > 0;

    if (tourId && explicitSlideType && p.slide !== '0' && !hasManualText) {
      try {
        // Делаем fetch к нашему безопасному Node.js API (с кэшированием)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';
        const res = await fetch(`${baseUrl}/api/tour-data?id=${encodeURIComponent(tourId)}`, {
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const tour = await res.json();
          
          // Динамический импорт утилит форматирования
          const {
            formatProgramForSlide,
            formatChecklistForSlide,
            formatIncludedForSlide,
            formatLogisticsForSlide,
          } = await import('@/lib/tour-formatting');

          let slideTitle = '';
          let slideText = '';
          let mappedSlideType: SlideType = 'default';

          //   Маппинг типов данных на наши НОВЫЕ журнальные дизайны
          switch (explicitSlideType) {
            case 'program':
              slideTitle = 'ПРОГРАММА ТУРА';
              slideText = formatProgramForSlide(tour.program);
              mappedSlideType = 'program';
              break;
            case 'checklist':
              slideTitle = 'ЧТО ВЗЯТЬ С СОБОЙ';
              slideText = formatChecklistForSlide(tour.checklist);
              mappedSlideType = 'checklist';
              break;
            case 'included':
              slideTitle = 'В СТОИМОСТЬ ВХОДИТ';
              slideText = formatIncludedForSlide(tour.includedDetailed, tour.included);
              mappedSlideType = 'included'; //   Теперь направляем прямо в наш новый обработчик
              break;
            case 'logistics':
              slideTitle = 'ЛОГИСТИКА';
              mappedSlideType = 'logistics'; //   Теперь у нас есть отдельный красивый дизайн с иконками!
              break;
            case 'highlights':
              slideTitle = 'ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ';
              mappedSlideType = 'highlights'; //   Добавили впечатления
              break;
            case 'price':
              slideTitle = 'СТОИМОСТЬ УЧАСТИЯ';
              mappedSlideType = 'price'; //   Добавили слайд с тарифами
              break;
          }

          // Переопределяем параметры для генератора
          const dynamicParams: OgParams = {
            ...p,
            slideType: mappedSlideType,
            slideTitle,
            slideText,
            title: tour.title || p.title,
            imageUrl: tour.coverImage || p.imageUrl,
            categoryColor: tour.category?.color || p.categoryColor,
            categoryTitle: tour.category?.title || p.categoryTitle,
          };

          return renderSlide(dynamicParams, fontConfig);
        }
      } catch (error) {
        console.error('[OG] Tour dynamic slide fetch error:', error);
        // При ошибке fetch просто пойдем по стандартному пути ниже
      }
    }

    // 2. СТАНДАРТНЫЙ ПУТЬ РЕНДЕРИНГА (если нет tourId или это обложка)
    if (p.format) {
      if (p.slide !== '0') return renderSlide(p, fontConfig); // Обычный слайд с текстом из URL
      if (p.format === 'story')                       return renderStory(p, fontConfig);
      if (p.format === 'feed' || p.format === 'post') return renderFeed(p, fontConfig);
      if (p.format === 'event')                       return renderEvent(p, fontConfig);
    }

    return renderSeoFallback(searchParams, fontConfig);

  } catch (e: unknown) {
    console.error('[OG] Unhandled error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}