// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ─── ЦВЕТОВАЯ ПАЛИТРА ───────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  teal:    '#14b8a6',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  emerald: '#10b981',
  violet:  '#8b5cf6',
  blue:    '#3b82f6',
  slate:   '#64748b',
};

// ─── УТИЛИТЫ ────────────────────────────────────────────────────────────────

/** Форматирует цену с разделителями разрядов (работает в Edge) */
function formatPrice(raw: string | null): string {
  if (!raw) return '';
  const n = Number(raw);
  if (isNaN(n)) return raw;
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

/** Полное название месяца: "26 апреля" */

function formatFullDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
    if (isNaN(d.getTime())) return raw;
    const months = [
      'января','февраля','марта','апреля','мая','июня',
      'июля','августа','сентября','октября','ноября','декабря'
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return raw;
  }
}

function formatShortDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
    if (isNaN(d.getTime())) return raw;
    const months = ['ЯНВ.','ФЕВ.','МАР.','АПР.','МАЯ','ИЮН.','ИЮЛ.','АВГ.','СЕН.','ОКТ.','НОЯ.','ДЕК.'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return raw;
  }
}

// ─── SVG-ИКОНКИ (масштабируемые через size prop) ────────────────────────────
const MapPinIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = ({ color, size = 32 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ArrowRightIcon = ({ color, size = 40 }: { color: string; size?: number }) => (
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

// ─── ГЛАВНЫЙ ОБРАБОТЧИК ─────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Загрузка шрифта (один раз, с таймаутом)
    let fontConfig: { name: string; data: ArrayBuffer; weight: 900 }[] | undefined;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const fontRes = await fetch(
        'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70f-m-Y.ttf',
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (fontRes.ok) {
        fontConfig = [{ name: 'Montserrat', data: await fontRes.arrayBuffer(), weight: 900 }];
      }
    } catch {
      // fallback — системный шрифт
    }

    const format = searchParams.get('format');
    const type   = searchParams.get('type') || 'tour';
    const slide  = searchParams.get('slide') || '0';

    // ─── ФОРМАТЫ SMM: story / feed / post / event ──────────────────────────
    if (format === 'story' || format === 'feed' || format === 'post' || format === 'event') {

      const title         = searchParams.get('title')         || 'Секретный тур';
      const price         = searchParams.get('price');
      const priceChild    = searchParams.get('priceChild');
      const priceMember   = searchParams.get('priceMember');
      const priceFamily   = searchParams.get('priceFamily');
      const currency      = searchParams.get('currency')      || 'MDL';
      const rawDate       = searchParams.get('date')          || '';
      const imageUrl      = searchParams.get('image');
      const categoryColor = searchParams.get('categoryColor') || 'teal';
      const categoryTitle = searchParams.get('categoryTitle') || 'ТУР';
      const trigger       = searchParams.get('trigger');
      const location      = searchParams.get('location')      || 'Локация уточняется';
      const duration      = searchParams.get('duration')      || '';
      const tagsStr       = searchParams.get('tags')          || '';
      const slideTitle    = (searchParams.get('slideTitle')   || '').toUpperCase();
      const slideText     = searchParams.get('slideText')     || '';

      const tags        = tagsStr.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
      const brandColor  = colorMap[categoryColor] ?? colorMap['teal'];
      const formattedDate = formatFullDate(rawDate);
      const shortDate   = formatShortDate(rawDate);
      const priceStr    = formatPrice(price);
      const priceChildStr = formatPrice(priceChild);
      const priceMemberStr = formatPrice(priceMember);
      const priceFamilyStr = formatPrice(priceFamily);

      const SIZES: Record<string, [number, number]> = {
        story: [1080, 1920],
        post:  [1080, 1080],
        event: [1920, 1005],
        feed:  [1080, 1350],
      };
      const [width, height] = SIZES[format] ?? [1080, 1350];

     // ------------------------------------------------------------------
      // СЛАЙДЫ (slide !== '0')
      // ------------------------------------------------------------------
      if (slide !== '0' || type === 'calendar') {
        const isCalendar = type === 'calendar' || slideTitle.includes('АФИША') || slideTitle.includes('РАСПИСАНИЕ');
        const useImageBg = !isCalendar;
        
        // Динамический коэффициент: для Story (1920) scale = 1, для Post (1080) scale = 0.56
        const scale = height / 1920;

        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0f172a', position: 'relative', fontFamily: 'Montserrat' }}>
              {useImageBg && imageUrl && (
                <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {useImageBg && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.88)' }} />}

              {/* Адаптивный паддинг основного контейнера */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: `${80 * scale}px`, position: 'relative', zIndex: 10 }}>

                {/* ----- АФИША / РАСПИСАНИЕ ----- */}
                {isCalendar ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                     {/* ... вставленный тобой новый код афиши ... */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: `${40 * scale}px`, opacity: 0.35 }}>
                      <span style={{ color: 'white', fontSize: `${28 * scale}px`, fontWeight: 900, letterSpacing: `${8 * scale}px` }}>EVATUR.CLUB</span>
                    </div>
                  </div>

                ) : slideTitle.includes('ДЕТАЛИ') ? (
                  // ----- ДЕТАЛИ -----
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <span style={{ fontSize: '64px', color: brandColor, fontWeight: 900, marginBottom: '56px' }}>{slideTitle}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px' }}>
                      {slideText.split('|').map((item, i) => {
                        const parts = item.split(':');
                        if (parts.length < 2) return null;
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', width: '46%', backgroundColor: '#1e293b', padding: '40px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span style={{ color: '#94a3b8', fontSize: '26px', fontWeight: 900, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>{parts[0].trim()}</span>
                            <span style={{ color: 'white', fontSize: '44px', fontWeight: 900, lineHeight: 1.2 }}>{parts[1].trim()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                ) : slideTitle.includes('ПРОГРАММА') ? (
                  // ----- ПРОГРАММА -----
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <span style={{ fontSize: '64px', color: brandColor, fontWeight: 900, marginBottom: '56px' }}>{slideTitle}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b', padding: '50px', borderRadius: '36px', border: '1px solid rgba(255,255,255,0.06)', gap: '36px' }}>
                      {slideText.split('|').map((item, i) => {
                        const parts = item.split('-');
                        if (parts.length < 2) return null;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '28px', flexShrink: 0 }}>
                              <div style={{ width: '18px', height: '18px', borderRadius: '9px', backgroundColor: brandColor }} />
                              {i < slideText.split('|').length - 2 && (
                                <div style={{ width: '3px', flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: '8px', minHeight: '40px' }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <span style={{ color: brandColor, fontSize: '30px', fontWeight: 900, marginBottom: '8px' }}>{parts[0].trim()}</span>
                              <span style={{ color: 'white', fontSize: '36px', fontWeight: 700, lineHeight: 1.35 }}>{parts[1].trim()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                ) : (slideTitle.includes('ВПЕЧАТЛЕНИЯ') || slideTitle.includes('ВКЛЮЧЕНО') || slideTitle.includes('С СОБОЙ')) ? (
                  // ----- ВПЕЧАТЛЕНИЯ / ВКЛЮЧЕНО / С СОБОЙ -----
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '56px' }}>
                      <SparklesIcon color={brandColor} size={52} />
                      <span style={{ fontSize: '64px', color: 'white', fontWeight: 900, marginLeft: '20px' }}>{slideTitle}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      {slideText.split('-').filter(t => t.trim()).map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', borderRadius: '18px', padding: '16px', marginRight: '28px', flexShrink: 0 }}>
                            <CheckIcon color={brandColor} size={34} />
                          </div>
                          <span style={{ color: '#e2e8f0', fontSize: '40px', fontWeight: 700, lineHeight: 1.4, flex: 1 }}>{t.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                ) : (
                  // ----- ПО УМОЛЧАНИЮ -----
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <span style={{ fontSize: '54px', color: brandColor, fontWeight: 900, letterSpacing: '2px', marginBottom: '40px' }}>{slideTitle}</span>
                    <span style={{ fontSize: '64px', color: 'white', fontWeight: 900, lineHeight: 1.4 }}>{slideText}</span>
                  </div>
                )}
              </div>
            </div>
          ),
          { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
        );
      }

      // ------------------------------------------------------------------
      // СЛАЙД 0 — ГЛАВНЫЕ ОБЛОЖКИ
      // ------------------------------------------------------------------

      // ----- STORY (1080×1920) -----
      if (format === 'story') {
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

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {trigger && (
                    <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '16px 36px', borderRadius: '100px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(245,158,11,0.5)' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.65)', border: `2px solid ${brandColor}`, padding: '18px 40px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: brandColor, marginRight: '18px', boxShadow: `0 0 14px ${brandColor}` }} />
                    <span style={{ fontSize: '38px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px' }}>{categoryTitle}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flex: 2 }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h1 style={{
                    color: 'white',
                    fontSize: type === 'blog' ? '128px' : '112px',
                    fontWeight: 900,
                    lineHeight: 0.95,
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
                          display: 'flex', backgroundColor: 'rgba(15,23,42,0.65)', border: '1px solid rgba(255,255,255,0.2)',
                          padding: '18px 34px', borderRadius: '18px', color: 'white', fontSize: '36px',
                          fontWeight: 900, textTransform: 'uppercase', boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                        }}># {tag}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flex: 1 }} />

                {type !== 'blog' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '28px', backgroundColor: 'rgba(15,23,42,0.7)',
                      padding: '28px 44px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.12)',
                      alignSelf: 'flex-start', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                    }}>
                      {formattedDate && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <CalendarIcon color={brandColor} size={36} />
                            <span style={{ color: 'white', fontSize: '38px', fontWeight: 900 }}>{formattedDate}</span>
                          </div>
                          <div style={{ width: '2px', height: '44px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        </>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <MapPinIcon color={brandColor} size={36} />
                        <span style={{ color: 'white', fontSize: '38px', fontWeight: 900 }}>{location}</span>
                      </div>
                      {duration && (
                        <>
                          <div style={{ width: '2px', height: '44px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <ClockIcon color={brandColor} size={36} />
                            <span style={{ color: 'white', fontSize: '38px', fontWeight: 900 }}>{duration}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {priceStr && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '34px', color: 'rgba(255,255,255,0.6)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '2px' }}>
                            {type === 'calendar' ? 'от' : 'Стоимость'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                            <span style={{ fontSize: '84px', color: 'white', fontWeight: 900, lineHeight: 1, textShadow: '0 8px 28px rgba(0,0,0,0.9)' }}>
                              {priceStr}
                            </span>
                            <span style={{ fontSize: '42px', color: brandColor, fontWeight: 900 }}>{currency}</span>
                          </div>
                          {/* Плашки с дополнительными тарифами */}
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                            {priceChildStr && (
                              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 20px', borderRadius: '24px', fontSize: '28px', color: '#e2e8f0', fontWeight: 700 }}>👶 Детский {priceChildStr} {currency}</span>
                            )}
                            {priceMemberStr && (
                              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 20px', borderRadius: '24px', fontSize: '28px', color: '#e2e8f0', fontWeight: 700 }}>👑 Клубный {priceMemberStr} {currency}</span>
                            )}
                            {priceFamilyStr && (
                              <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 20px', borderRadius: '24px', fontSize: '28px', color: '#e2e8f0', fontWeight: 700 }}>👨‍👩‍👧 Семейный {priceFamilyStr} {currency}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50px', backgroundColor: brandColor, boxShadow: `0 10px 40px ${brandColor}80`, flexShrink: 0 }}>
                          <ArrowRightIcon color="#0f172a" size={44} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: brandColor, padding: '26px 52px', borderRadius: '100px', boxShadow: `0 12px 40px ${brandColor}60` }}>
                      <span style={{ fontSize: '36px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>📖 Читать статью</span>
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

      // ----- FEED / POST (1080×1350 или 1080×1080) -----
      if (format === 'feed' || format === 'post') {
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

             <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: format === 'post' ? '50px' : '60px', position: 'relative', zIndex: 10 }}>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {trigger && (
                    <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '12px 28px', borderRadius: '100px', marginBottom: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.65)', border: `2px solid ${brandColor}`, padding: '14px 32px', borderRadius: '100px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '7px', backgroundColor: brandColor, marginRight: '16px', boxShadow: `0 0 12px ${brandColor}` }} />
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px' }}>{categoryTitle}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flex: 1 }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h1 style={{
                    color: 'white',
                    fontSize: type === 'blog' ? '84px' : (format === 'post' ? '64px' : '76px'),
                    fontWeight: 900,
                    lineHeight: 0.95,
                    margin: '0 0 24px 0',
                    textTransform: 'uppercase',
                    textShadow: '0 8px 32px rgba(0,0,0,0.9)',
                  }}>
                    {title}
                  </h1>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {tags.map((tag, idx) => (
                        <div key={idx} style={{
                          display: 'flex', backgroundColor: 'rgba(15,23,42,0.65)', border: '1px solid rgba(255,255,255,0.18)',
                          padding: '14px 28px', borderRadius: '16px', color: 'white', fontSize: '30px',
                          fontWeight: 900, textTransform: 'uppercase',
                        }}># {tag}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flex: 1 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                  {type !== 'blog' ? (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '32px', backgroundColor: 'rgba(15,23,42,0.7)',
                        padding: '28px 40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.12)',
                        alignSelf: 'flex-start', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                      }}>
                        {formattedDate && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <CalendarIcon color={brandColor} size={32} />
                              <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{formattedDate}</span>
                            </div>
                            <div style={{ width: '2px', height: '44px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                          </>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <MapPinIcon color={brandColor} size={32} />
                          <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{location}</span>
                        </div>
                        {duration && (
                          <>
                            <div style={{ width: '2px', height: '44px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <ClockIcon color={brandColor} size={32} />
                              <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{duration}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {priceStr && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '30px', color: 'rgba(255,255,255,0.6)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '2px' }}>
                              {type === 'calendar' ? 'от' : 'Стоимость'}
                            </span>
                       <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
                              <span style={{ fontSize: format === 'post' ? '72px' : '84px', color: 'white', fontWeight: 900, lineHeight: 1, textShadow: '0 8px 28px rgba(0,0,0,0.9)' }}>
                                {priceStr}
                              </span>
                              <span style={{ fontSize: format === 'post' ? '32px' : '38px', color: brandColor, fontWeight: 900 }}>{currency}</span>
                            </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                              {priceChildStr && (
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 16px', borderRadius: '20px', fontSize: '24px', color: '#e2e8f0', fontWeight: 700 }}>👶 Детский {priceChildStr} {currency}</span>
                              )}
                              {priceMemberStr && (
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 16px', borderRadius: '20px', fontSize: '24px', color: '#e2e8f0', fontWeight: 700 }}>👑 Клубный {priceMemberStr} {currency}</span>
                              )}
                              {priceFamilyStr && (
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '6px 16px', borderRadius: '20px', fontSize: '24px', color: '#e2e8f0', fontWeight: 700 }}>👨‍👩‍👧 Семейный {priceFamilyStr} {currency}</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', borderRadius: '45px', backgroundColor: brandColor, boxShadow: `0 10px 36px ${brandColor}80`, flexShrink: 0 }}>
                            <ArrowRightIcon color="#0f172a" size={40} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: brandColor, padding: '22px 48px', borderRadius: '100px', boxShadow: `0 12px 40px ${brandColor}60` }}>
                        <span style={{ fontSize: '32px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>📖 Читать статью</span>
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

      // ----- EVENT (1920×1005) -----
      if (format === 'event') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#0d131a', fontFamily: 'Montserrat' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '45%', height: '100%', padding: '80px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
                  <MapPinIcon color={brandColor} size={36} />
                  <span style={{ color: '#cbd5e1', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase' }}>{location}</span>
                  <span style={{ color: '#475569', fontSize: '32px' }}>•</span>
                  <ClockIcon color={brandColor} size={36} />
                  <span style={{ color: '#cbd5e1', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase' }}>{duration}</span>
                </div>
                <h1 style={{ color: 'white', fontSize: '88px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 56px 0', textTransform: 'uppercase' }}>{title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
                  {formattedDate && (
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', border: `2px solid ${brandColor}`, padding: '22px 36px', borderRadius: '16px' }}>
                      <CalendarIcon color={brandColor} size={38} />
                      <span style={{ color: 'white', fontSize: '40px', fontWeight: 900, marginLeft: '14px' }}>{formattedDate}</span>
                    </div>
                  )}
                  {priceStr && type !== 'blog' && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <span style={{ fontSize: '68px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{priceStr}</span>
                      <span style={{ fontSize: '36px', color: brandColor, fontWeight: 900 }}>{currency}</span>
                    </div>
                  )}
                </div>
              </div>
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
    }

    // ─── FALLBACK: SEO Open Graph (1200×630) ─────────────────────────────────
    const seoTitle    = searchParams.get('title')    || 'Туры и сплавы';
    const seoSubtitle = searchParams.get('subtitle') || 'Турклуб ЭВА';

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', border: '4px solid #8b5cf6', borderRadius: '30px', backgroundColor: '#0f172a', boxShadow: '0 20px 40px rgba(139,92,246,0.2)' }}>
            <span style={{ fontSize: '40px', color: '#a78bfa', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>{seoSubtitle}</span>
            <span style={{ fontSize: '75px', color: 'white', fontWeight: 'bold', textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>{seoTitle}</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

  } catch (e: unknown) {
    console.error('[OG] Unhandled error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}