// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ─── ШРИФТ НА УРОВНЕ МОДУЛЯ ─────────────────────────────────────────────────
// Загружается один раз при холодном старте Edge-контейнера.
// При повторных запросах Promise уже resolved — await возвращает мгновенно.
// Файл: /public/fonts/Montserrat-Black.ttf
const fontPromise: Promise<ArrayBuffer | null> = fetch(
  new URL('/fonts/Montserrat-Black.ttf', process.env.NEXT_PUBLIC_SITE_URL)
)
  .then((r) => (r.ok ? r.arrayBuffer() : null))
  .catch(() => null);

// ─── ТИПЫ ───────────────────────────────────────────────────────────────────

type SmmFormat = 'story' | 'feed' | 'post' | 'event';

/**
 * Тип слайда передаётся явно через ?slideType=...
 * Fallback: определяется по slideTitle для обратной совместимости.
 */
type SlideType = 'details' | 'program' | 'checklist' | 'default';

interface FontConfig {
  name:   string;
  data:   ArrayBuffer;
  weight: 900;
}

/** Все параметры запроса после валидации и нормализации */
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
  width:          number;
  height:         number;
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

/**
 * Определяет SlideType из явного параметра или по slideTitle (обратная совместимость).
 * calendar исключён — он живёт в /api/og/calendar.
 */
function resolveSlideType(explicit: string | null, title: string): SlideType {
  const VALID: SlideType[] = ['details', 'program', 'checklist', 'default'];
  if (explicit && VALID.includes(explicit as SlideType)) return explicit as SlideType;
  const t = title.toUpperCase();
  if (t.includes('ДЕТАЛИ'))                                                          return 'details';
  if (t.includes('ПРОГРАММА'))                                                       return 'program';
  if (t.includes('ВПЕЧАТЛЕНИЯ') || t.includes('ВКЛЮЧЕНО') || t.includes('С СОБОЙ')) return 'checklist';
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
  const currency      = searchParams.get('currency')      || 'MDL';
  const rawDate       = searchParams.get('date')          || '';
  const imageUrl      = searchParams.get('image')         || null;
  const trigger       = searchParams.get('trigger')       || null;
  const location      = searchParams.get('location')      || 'Локация уточняется';
  const duration      = searchParams.get('duration')      || '';
  const tagsStr       = searchParams.get('tags')          || '';

  // Неизвестный цвет → fallback teal
  const rawColor      = searchParams.get('categoryColor') || 'teal';
  const categoryColor = COLOR_MAP[rawColor] ? rawColor : 'teal';
  const categoryTitle = searchParams.get('categoryTitle') || 'ТУР';

  const tags          = tagsStr.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
  const brandColor    = COLOR_MAP[categoryColor]!;
  const formattedDate = formatFullDate(rawDate);

  // Невалидные цены → '' → блок не рендерится
  const priceStr      = formatPrice(searchParams.get('price'));
  const priceChildStr = formatPrice(searchParams.get('priceChild'));
  const priceMemberStr= formatPrice(searchParams.get('priceMember'));
  const priceFamilyStr= formatPrice(searchParams.get('priceFamily'));

  const [width, height] = format ? (SIZES[format] ?? [1080, 1350]) : [1080, 1350];

  return {
    format, type, slide, slideType, slideTitle, slideText,
    title, currency, rawDate, imageUrl, categoryColor, categoryTitle,
    trigger, location, duration, tags, brandColor, formattedDate,
    priceStr, priceChildStr, priceMemberStr, priceFamilyStr,
    width, height,
  };
}

// ─── SVG-ИКОНКИ ─────────────────────────────────────────────────────────────

export const MapPinIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const ClockIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const CalendarIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export const ArrowRightIcon = ({ color, size = 40 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const SparklesIcon = ({ color, size = 48 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
  </svg>
);

const CheckIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── ПЕРЕИСПОЛЬЗУЕМЫЕ UI-БЛОКИ ───────────────────────────────────────────────

/** Строка с датой / локацией / длительностью */
function MetaBar({ p, iconSize, fontSize, gap, padding }: {
  p: OgParams; iconSize: number; fontSize: string; gap: string; padding: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap,
      backgroundColor: 'rgba(15,23,42,0.7)', padding,
      borderRadius: '30px', border: '1px solid rgba(255,255,255,0.12)',
      alignSelf: 'flex-start', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
      flexWrap: 'wrap',
    }}>
      {p.formattedDate && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon color={p.brandColor} size={iconSize} />
            <span style={{ color: 'white', fontSize, fontWeight: 900 }}>{p.formattedDate}</span>
          </div>
          <div style={{ width: '2px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </>
      )}
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

/** Блок стоимости с плашками тарифов */
function PriceBlock({ p, priceFontSize, currencyFontSize, labelFontSize, badgeFontSize, arrowSize }: {
  p: OgParams; priceFontSize: string; currencyFontSize: string;
  labelFontSize: string; badgeFontSize: string; arrowSize: number;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 18px', borderRadius: '20px', fontSize: badgeFontSize, color: '#e2e8f0', fontWeight: 700 }}>
                👶 Детский {p.priceChildStr} {p.currency}
              </span>
            )}
            {p.priceMemberStr && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 18px', borderRadius: '20px', fontSize: badgeFontSize, color: '#e2e8f0', fontWeight: 700 }}>
                👑 Клубный {p.priceMemberStr} {p.currency}
              </span>
            )}
            {p.priceFamilyStr && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 18px', borderRadius: '20px', fontSize: badgeFontSize, color: '#e2e8f0', fontWeight: 700 }}>
                👨‍👩‍👧 Семейный {p.priceFamilyStr} {p.currency}
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

/** ДЕТАЛИ — сетка карточек ключ:значение */
function renderDetailsSlide(p: OgParams) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <span style={{ fontSize: '64px', color: p.brandColor, fontWeight: 900, marginBottom: '48px' }}>
        {p.slideTitle}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {p.slideText.split('|').map((item, i) => {
          const parts = item.split(':');
          if (parts.length < 2) return null;
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', width: '46%',
              backgroundColor: '#1e293b', padding: '36px',
              borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ color: '#94a3b8', fontSize: '22px', fontWeight: 900, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {parts[0].trim()}
              </span>
              <span style={{ color: 'white', fontSize: '40px', fontWeight: 900, lineHeight: 1.2 }}>
                {parts[1].trim()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ПРОГРАММА — таймлайн с точками и соединительными линиями */
function renderProgramSlide(p: OgParams) {
  const items = p.slideText.split('|').filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <span style={{ fontSize: '64px', color: p.brandColor, fontWeight: 900, marginBottom: '48px' }}>
        {p.slideTitle}
      </span>
      <div style={{
        display: 'flex', flexDirection: 'column',
        backgroundColor: '#1e293b', padding: '44px',
        borderRadius: '32px', border: '1px solid rgba(255,255,255,0.06)',
        gap: '32px',
      }}>
        {items.map((item, i) => {
          const parts = item.split('-');
          if (parts.length < 2) return null;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '24px', flexShrink: 0 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: p.brandColor }} />
                {i < items.length - 1 && (
                  <div style={{ width: '2px', flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: '8px', minHeight: '36px' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ color: p.brandColor, fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
                  {parts[0].trim()}
                </span>
                <span style={{ color: 'white', fontSize: '32px', fontWeight: 700, lineHeight: 1.35 }}>
                  {parts.slice(1).join('-').trim()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ВКЛЮЧЕНО / ВПЕЧАТЛЕНИЯ / С СОБОЙ — чеклист со значками */
function renderChecklistSlide(p: OgParams) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
        <SparklesIcon color={p.brandColor} size={48} />
        <span style={{ fontSize: '60px', color: 'white', fontWeight: 900, marginLeft: '18px' }}>
          {p.slideTitle}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {p.slideText.split('-').filter(t => t.trim()).map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#1e293b', borderRadius: '16px',
              padding: '14px', marginRight: '24px', flexShrink: 0,
            }}>
              <CheckIcon color={p.brandColor} size={30} />
            </div>
            <span style={{ color: '#e2e8f0', fontSize: '36px', fontWeight: 700, lineHeight: 1.4, flex: 1 }}>
              {t.trim()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Дефолтный слайд — заголовок + текст по центру */
function renderDefaultSlide(p: OgParams) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <span style={{ fontSize: '50px', color: p.brandColor, fontWeight: 900, letterSpacing: '2px', marginBottom: '36px' }}>
        {p.slideTitle}
      </span>
      <span style={{ fontSize: '60px', color: 'white', fontWeight: 900, lineHeight: 1.4 }}>
        {p.slideText}
      </span>
    </div>
  );
}

// ─── РЕНДЕРЕРЫ ФОРМАТОВ ──────────────────────────────────────────────────────

/** Контентные слайды — маршрутизирует по slideType */
function renderSlide(p: OgParams, fontConfig: FontConfig[] | undefined) {
  const useImageBg = true;
  let content: React.ReactNode;

  switch (p.slideType) {
    case 'details':   content = renderDetailsSlide(p);   break;
    case 'program':   content = renderProgramSlide(p);   break;
    case 'checklist': content = renderChecklistSlide(p); break;
    default:          content = renderDefaultSlide(p);   break;
  }

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0f172a', position: 'relative', fontFamily: 'Montserrat' }}>
        {useImageBg && p.imageUrl && (
          <img src={p.imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {useImageBg && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.88)' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px', position: 'relative', zIndex: 10 }}>
          {content}
        </div>
      </div>
    ),
    { width: p.width, height: p.height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}

/** Story (1080×1920) — обложка для Instagram Stories */
function renderStory(p: OgParams, fontConfig: FontConfig[] | undefined) {
  const { width, height, brandColor, imageUrl, title, categoryTitle, trigger, tags, type, priceStr } = p;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
        {imageUrl && (
          <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(2,6,23,0) 0%, rgba(2,6,23,0.15) 35%, rgba(2,6,23,0.75) 60%, rgba(2,6,23,0.97) 100%)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '140px 80px 100px 80px', position: 'relative', zIndex: 10 }}>

          {/* Шапка: триггер + категория */}
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

          <div style={{ display: 'flex', flex: 2 }} />

          {/* Заголовок + теги */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{
              color: 'white',
              fontSize: type === 'blog' ? '128px' : '112px',
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

          {/* Нижний блок: мета + цена */}
          {type !== 'blog' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <MetaBar p={p} iconSize={36} fontSize="38px" gap="24px" padding="26px 40px" />
              {priceStr && (
                <PriceBlock p={p} priceFontSize="84px" currencyFontSize="42px" labelFontSize="32px" badgeFontSize="26px" arrowSize={96} />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: brandColor, padding: '26px 52px', borderRadius: '100px', boxShadow: `0 12px 40px ${brandColor}60` }}>
                <span style={{ fontSize: '36px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                  📖 Читать статью
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50px', backgroundColor: 'rgba(15,23,42,0.6)', border: `2px solid ${brandColor}` }}>
                <ArrowRightIcon color={brandColor} size={44} />
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  );
}

/** Feed / Post (1080×1350 или 1080×1080) */
function renderFeed(p: OgParams, fontConfig: FontConfig[] | undefined) {
  const { width, height, format, brandColor, imageUrl, title, categoryTitle, trigger, tags, type, priceStr } = p;
  const isPost = format === 'post';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
        {imageUrl && (
          <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.25) 30%, rgba(15,23,42,0.82) 65%, rgba(15,23,42,1) 100%)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: isPost ? '50px' : '60px', position: 'relative', zIndex: 10 }}>

          {/* Шапка */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {trigger && (
              <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '12px 28px', borderRadius: '100px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  🔥 {trigger}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.65)', border: `2px solid ${brandColor}`, padding: '14px 32px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '7px', backgroundColor: brandColor, marginRight: '16px', boxShadow: `0 0 12px ${brandColor}` }} />
              <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px' }}>
                {categoryTitle}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

          {/* Заголовок + теги */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h1 style={{
              color: 'white',
              fontSize: type === 'blog' ? '84px' : (isPost ? '64px' : '76px'),
              fontWeight: 900, lineHeight: 0.95,
              margin: '0 0 24px 0',
              textTransform: 'uppercase',
              textShadow: '0 8px 32px rgba(0,0,0,0.9)',
            }}>
              {title}
            </h1>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                {tags.map((tag, idx) => (
                  <div key={idx} style={{
                    display: 'flex', backgroundColor: 'rgba(15,23,42,0.65)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    padding: '12px 24px', borderRadius: '14px',
                    color: 'white', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase',
                  }}>
                    # {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1 }} />

          {/* Нижний блок */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {type !== 'blog' ? (
              <>
                <MetaBar p={p} iconSize={30} fontSize="32px" gap="20px" padding="22px 32px" />
                {priceStr && (
                  <PriceBlock p={p} priceFontSize={isPost ? '68px' : '78px'} currencyFontSize={isPost ? '30px' : '36px'} labelFontSize="26px" badgeFontSize="22px" arrowSize={84} />
                )}
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: brandColor, padding: '22px 48px', borderRadius: '100px', boxShadow: `0 12px 40px ${brandColor}60` }}>
                  <span style={{ fontSize: '32px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    📖 Читать статью
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', borderRadius: '45px', backgroundColor: 'rgba(15,23,42,0.6)', border: `2px solid ${brandColor}` }}>
                  <ArrowRightIcon color={brandColor} size={40} />
                </div>
              </div>
            )}
          </div>
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
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
                  СТОИМОСТЬ ТУРА
                </span>
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
            <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <span style={{ fontSize: '40px', color: '#a78bfa', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {seoSubtitle}
          </span>
          <span style={{ fontSize: '75px', color: 'white', fontWeight: 900, textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>
            {seoTitle}
          </span>
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

    // fontPromise создан на уровне модуля — повторные вызовы мгновенны
    const fontData = await fontPromise;
    const fontConfig: FontConfig[] | undefined = fontData
      ? [{ name: 'Montserrat', data: fontData, weight: 900 }]
      : undefined;

    const p = parseParams(searchParams);

    if (p.format) {
      // Контентные слайды (slide !== '0')
      if (p.slide !== '0') return renderSlide(p, fontConfig);

      // Обложки (slide === '0')
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
