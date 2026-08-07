// src/app/api/og/calendar/route.tsx
//
// POST /api/og/calendar
//
// Генерирует OG-изображение афиши (расписания туров) для Instagram Stories и Feed.
// Принимает JSON-тело вместо URL-параметров — нет ограничения на размер данных.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ─── ШРИФТ НА УРОВНЕ МОДУЛЯ ─────────────────────────────────────────────────
const fontPromise: Promise<ArrayBuffer | null> = fetch(
  new URL('/fonts/Montserrat-Black.ttf', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
)
  .then((r) => (r.ok ? r.arrayBuffer() : null))
  .catch(() => null);

// ─── ТИПЫ ───────────────────────────────────────────────────────────────────

type CalendarFormat = 'story' | 'feed';
type CalendarPeriod = 'week' | '2weeks' | 'month';

export interface CalendarEvent {
  date:      string;           // ISO: '2026-04-25'
  category:  string;           // 'МЕСТНОЕ', 'SUP', ...
  color:     string;           // ключ из COLOR_MAP
  duration?: string;           // '1 ДЕНЬ', '3-4 ЧАСА'
  title:     string;
  location?: string;
  price?:    number | null;
  currency?: string;
}

export interface CalendarOgRequest {
  format:      CalendarFormat;
  period:      CalendarPeriod;
  brandColor?: string;         // акцентный цвет заголовка, default 'teal'
  events:      CalendarEvent[];
}

interface FontConfig {
  name:   string;
  data:   ArrayBuffer;
  weight: 900;
}

// ─── ЦВЕТОВАЯ ПАЛИТРА ───────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
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

/** hex → rgba(r,g,b,0.15) для фона бейджей */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SIZES: Record<CalendarFormat, [number, number]> = {
  story: [1080, 1920],
  feed:  [1080, 1350],
};

// ─── ЗАГОЛОВКИ ПЕРИОДОВ ─────────────────────────────────────────────────────
const PERIOD_LABELS: Record<CalendarPeriod, string> = {
  week:   'АФИША НА НЕДЕЛЮ',
  '2weeks': 'АФИША НА 2 НЕДЕЛИ',
  month:  'АФИША НА МЕСЯЦ',
};

// ─── УТИЛИТЫ ────────────────────────────────────────────────────────────────

/** Форматирует цену с неразрывными пробелями */
function formatPrice(n: number): string {
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

/**
 * Возвращает число и день недели из ISO-даты.
 * T12:00:00 защищает от UTC-сдвига.
 */
function parseDateParts(iso: string): { dayNum: string; weekday: string; monthLabel: string } {
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
    if (isNaN(d.getTime())) return { dayNum: '', weekday: '', monthLabel: '' };

    const WEEKDAYS     = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'];
    const MONTHS_FULL  = ['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ','ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ'];

    return {
      dayNum:     String(d.getDate()),
      weekday:    WEEKDAYS[d.getDay()],
      monthLabel: `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()} Г.`,
    };
  } catch {
    return { dayNum: '', weekday: '', monthLabel: '' };
  }
}

/**
 * Группирует события по месяцам.
 * Возвращает Map<monthLabel, CalendarEvent[]> в порядке появления.
 */
function groupByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const { monthLabel } = parseDateParts(ev.date);
    const key = monthLabel || 'Без даты';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

// ─── SVG-ИКОНКИ ─────────────────────────────────────────────────────────────

const MapPinIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ArrowRightIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

// ─── КОМПОНЕНТЫ ─────────────────────────────────────────────────────────────

/** Разделитель месяца — горизонтальная линия с подписью по центру */
function MonthHeader({ label, brandColor, s }: { label: string; brandColor: string; s: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: `${20 * s}px`, marginTop: `${8 * s}px` }}>
      <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: `${8 * s}px`,
        paddingLeft: `${20 * s}px`, paddingRight: `${20 * s}px`,
        paddingTop: `${8 * s}px`, paddingBottom: `${8 * s}px`,
        borderRadius: '100px',
        backgroundColor: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        margin: `0 ${16 * s}px`,
      }}>
        <div style={{
          width: `${6 * s}px`, height: `${6 * s}px`, borderRadius: '50%',
          backgroundColor: brandColor,
          boxShadow: `0 0 ${10 * s}px ${brandColor}`,
        }} />
        <span style={{ color: 'white', fontSize: `${22 * s}px`, fontWeight: 900, letterSpacing: `${3 * s}px` }}>
          {label}
        </span>
      </div>
      <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

/** Карточка одного события (ОГРОМНЫЕ ШРИФТЫ) */
function EventCard({ ev, brandColor, s }: { ev: CalendarEvent; brandColor: string; s: number }) {
  const { dayNum, weekday } = parseDateParts(ev.date);
  const evColorHex  = COLOR_MAP[ev.color] ?? brandColor;
  const evBadgeBg   = hexToRgba(evColorHex, 0.15);
  const priceFormatted = ev.price != null ? formatPrice(ev.price) : null;
  const currency = ev.currency ?? 'RUB';

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      backgroundColor: '#0d131a',
      borderRadius: `${24 * s}px`, // Скруглили углы чуть больше
      border: '2px solid rgba(255,255,255,0.06)', // Граница жирнее
      overflow: 'hidden',
      flexShrink: 0,
      width: '100%',
    }}>
      {/* Дата (Гигантский календарный блок) */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: `${110 * s}px`, flexShrink: 0, // Блок даты стал шире
        backgroundColor: 'rgba(15,23,42,0.6)',
        borderRight: '2px solid rgba(255,255,255,0.05)',
        padding: `${20 * s}px ${10 * s}px`,
      }}>
        <span style={{ color: 'white', fontSize: `${54 * s}px`, fontWeight: 900, lineHeight: 1 }}>
          {dayNum}
        </span>
        <span style={{ color: '#64748b', fontSize: `${20 * s}px`, fontWeight: 900, marginTop: `${6 * s}px`, letterSpacing: '0.15em' }}>
          {weekday}
        </span>
      </div>

      {/* Основной контент */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: `${24 * s}px ${24 * s}px`, minWidth: 0 }}>
        {/* Бейджи: категория + длительность */}
        <div style={{ display: 'flex', alignItems: 'center', gap: `${12 * s}px`, marginBottom: `${12 * s}px`, flexWrap: 'wrap' }}>
          {ev.category && (
            <span style={{
              display: 'flex',
              backgroundColor: evBadgeBg,
              border: `1px solid ${evColorHex}40`,
              color: evColorHex,
              fontSize: `${18 * s}px`, fontWeight: 900, // Увеличили бейдж
              paddingLeft: `${14 * s}px`, paddingRight: `${14 * s}px`,
              paddingTop: `${6 * s}px`, paddingBottom: `${6 * s}px`,
              borderRadius: `${8 * s}px`,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              flexShrink: 0,
            }}>
              {ev.category}
            </span>
          )}
          {ev.duration && (
            <span style={{ color: '#64748b', fontSize: `${18 * s}px`, fontWeight: 700, flexShrink: 0 }}>
              {ev.duration}
            </span>
          )}
        </div>

        {/* Название тура (Огромный шрифт) */}
        <span style={{
          color: 'white', fontSize: `${32 * s}px`, fontWeight: 900, // С 22 до 32!
          lineHeight: 1.25, marginBottom: `${12 * s}px`,
          overflow: 'hidden',
          textTransform: 'uppercase',
        }}>
          {ev.title}
        </span>

        {/* Локация */}
        {ev.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * s}px` }}>
            <MapPinIcon color={`${evColorHex}90`} size={20 * s} />
            <span style={{ color: '#94a3b8', fontSize: `${20 * s}px`, fontWeight: 700 }}>
              {ev.location}
            </span>
          </div>
        )}
      </div>

      {/* Цена + стрелка */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
        padding: `${20 * s}px ${24 * s}px`,
        borderLeft: '2px solid rgba(255,255,255,0.05)',
        flexShrink: 0, gap: `${12 * s}px`,
      }}>
        {priceFormatted && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: '#475569', fontSize: `${14 * s}px`, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Билет от
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: `${4 * s}px` }}>
              <span style={{ color: 'white', fontSize: `${40 * s}px`, fontWeight: 900, lineHeight: 1 }}>
                {priceFormatted}
              </span>
              <span style={{ color: evColorHex, fontSize: `${18 * s}px`, fontWeight: 900 }}>
                {currency}
              </span>
            </div>
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: `${48 * s}px`, height: `${48 * s}px`, borderRadius: '50%',
          backgroundColor: 'rgba(30,41,59,1)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <ArrowRightIcon color="#64748b" size={22 * s} />
        </div>
      </div>
    </div>
  );
}

// ─── РЕНДЕРЕР ────────────────────────────────────────────────────────────────
function renderCalendar(
  body: CalendarOgRequest,
  fontConfig: FontConfig[] | undefined
): ImageResponse {
  const { format, period, events, brandColor: rawBrandColor = 'teal' } = body;

  const [width, height] = SIZES[format] ?? SIZES.story;

  // Жестко фиксируем базовый масштаб на 1.3, чтобы всё было огромным
  let s = (width / 1080) * 1.3;

  if (events.length <= 2) {
    s *= 1.3; // Гигантские
  } else if (events.length === 3) {
    s *= 1.15; // Очень крупные
  } else if (events.length === 4) {
    s *= 0.95; // Сжимаем, чтобы уверенно влезли 4 карточки + месяцы
  } else {
    s *= 0.8; // Сжимаем сильнее для 5 карточек
  }

  const brandColorHex = COLOR_MAP[rawBrandColor] ?? COLOR_MAP['teal']!;
  const periodLabel   = PERIOD_LABELS[period] ?? 'АФИША';

  const grouped = groupByMonth(events);
  const hasMultipleMonths = grouped.size > 1;

  // Динамические отступы (уменьшаем для 4 и 5 элементов)
  const parentGap = events.length <= 3 ? 140 * s : events.length === 4 ? 60 * s : 30 * s;
  const childGap  = events.length <= 3 ? 100 * s : events.length === 4 ? 40 * s : 20 * s;
  
  return new ImageResponse(
    (
    <div style={{
        display: 'flex', flexDirection: 'column',
        width: '100%', height: '100%',
        backgroundColor: '#0b1120',
        fontFamily: 'Montserrat',
        // Боковые поля стали 40 (с учетом масштаба), чтобы карточки были от края до края
        padding: `${80 * s}px ${40 * s}px`,
      }}>

        {/* ── Заголовок афиши ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: `${60 * s}px` }}>
          <div style={{ height: '3px', flex: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: `${10 * s}px`,
            paddingLeft: `${28 * s}px`, paddingRight: `${28 * s}px`,
            paddingTop: `${12 * s}px`, paddingBottom: `${12 * s}px`,
            borderRadius: '100px',
            backgroundColor: 'rgba(15,23,42,0.95)',
            border: `1px solid ${brandColorHex}30`,
            margin: `0 ${20 * s}px`,
          }}>
            <div style={{
              width: `${8 * s}px`, height: `${8 * s}px`, borderRadius: '50%',
              backgroundColor: brandColorHex,
              boxShadow: `0 0 ${14 * s}px ${brandColorHex}`,
            }} />
            <span style={{ color: 'white', fontSize: `${26 * s}px`, fontWeight: 900, letterSpacing: `${3 * s}px` }}>
              {periodLabel}
            </span>
          </div>
          <div style={{ height: '3px', flex: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* ── События ── */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flex: 1, 
          justifyContent: 'center', //   Жесткая центровка (отступы раздвинут элементы равномерно)
          gap: `${parentGap}px`, 
          overflow: 'hidden' 
        }}>
          {hasMultipleMonths
            ? // Многомесячная афиша
              Array.from(grouped.entries()).map(([monthLabel, monthEvents]) => (
                <div key={monthLabel} style={{ display: 'flex', flexDirection: 'column' }}>
                  <MonthHeader label={monthLabel} brandColor={brandColorHex} s={s} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${childGap}px` }}>
                    {monthEvents.map((ev, i) => (
                      <EventCard key={`${ev.date}-${i}`} ev={ev} brandColor={brandColorHex} s={s} />
                    ))}
                  </div>
                </div>
              ))
            : // Один месяц
              events.map((ev, i) => (
                <EventCard key={`${ev.date}-${i}`} ev={ev} brandColor={brandColorHex} s={s} />
              ))
          }
        </div>

        {/* ── Футер ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: `${40 * s}px`, opacity: 0.2 }}>
          <span style={{ color: 'white', fontSize: `${20 * s}px`, fontWeight: 900, letterSpacing: `${8 * s}px` }}>
            EVATUR.CLUB
          </span>
        </div>

      </div>
    ),
    {
      width,
      height,
      fonts: fontConfig,
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    }
  );
}

// ─── ОБРАБОТЧИК ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: CalendarOgRequest;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'events[] is required and must not be empty' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const format: CalendarFormat =
      body.format === 'story' || body.format === 'feed' ? body.format : 'story';
    const period: CalendarPeriod =
      body.period === 'week' || body.period === '2weeks' || body.period === 'month'
        ? body.period : 'month';

   const events: CalendarEvent[] = body.events
      .filter(ev => ev.title && ev.date)
      .sort((a, b) => {
        const da = new Date(a.date.includes('T') ? a.date : `${a.date}T12:00:00`).getTime();
        const db = new Date(b.date.includes('T') ? b.date : `${b.date}T12:00:00`).getTime();
        return da - db;
      })
      .slice(0, 5);

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid events after filtering' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fontData = await fontPromise;
    const fontConfig: FontConfig[] | undefined = fontData
      ? [{ name: 'Montserrat', data: fontData, weight: 900 }]
      : undefined;

    return renderCalendar({ ...body, format, period, events }, fontConfig);

  } catch (e: unknown) {
    console.error('[OG/calendar] Unhandled error:', e);
    return new Response('Failed to generate calendar image', { status: 500 });
  }
}