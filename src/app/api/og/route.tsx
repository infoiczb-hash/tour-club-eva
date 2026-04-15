// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { withRateLimitRoute } from '@/lib/rate-limit-server';

export const runtime = 'edge';

// Цвета категорий для наследования дизайн-системы турклуба
const colorMap: Record<string, string> = {
  teal: '#14b8a6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  emerald: '#10b981',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  slate: '#64748b',
  orange: '#f97316',
};

// === ИКОНКИ (Чистые SVG) ===
const MapPinIcon = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const ArrowRightIcon = ({ color }: { color: string }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const SparklesIcon = ({ color }: { color: string }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export const GET = withRateLimitRoute(async (request: Request) => {
  try {
    // ─── ВЕКТОР 1: ЗАГРУЗКА КАСТОМНЫХ ШРИФТОВ MONTSERRAT ───
    const montserratBlack = await fetch(
      new URL('https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70f-m-Y.ttf')
    ).then((res) => res.arrayBuffer());

    const montserratBold = await fetch(
      new URL('https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf')
    ).then((res) => res.arrayBuffer());

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); 
    const slide = searchParams.get('slide') || '0';

    // ─── 1. НОВЫЙ SMM ДВИЖОК ───
    if (format === 'post' || format === 'feed' || format === 'story' || format === 'event') {
      const title = searchParams.get('title') || 'Секретный тур';
      const price = searchParams.get('price');
      const currency = searchParams.get('currency') || 'MDL';
      
      // Обработка даты (убираем точки, делаем капсом)
      const rawDate = searchParams.get('date') || '';
      const date = rawDate.replace('.', '').toUpperCase();
      
      const imageUrl = searchParams.get('image');
      const categoryColor = searchParams.get('categoryColor') || 'teal';
      const categoryTitle = searchParams.get('categoryTitle') || 'ТУР'; // Реальное название категории
      const trigger = searchParams.get('trigger'); 
      
      const location = searchParams.get('location') || 'Локация уточняется';
      const duration = searchParams.get('duration') || '1 день';
      
      const tagsStr = searchParams.get('tags') || '';
      const tags = tagsStr.split(',').filter(Boolean).slice(0, 3); // Максимум 3 тега

      const slideTitle = searchParams.get('slideTitle') || 'О МАРШРУТЕ';
      const slideText = searchParams.get('slideText') || 'Детали маршрута уточняются.';

      const brandColor = colorMap[categoryColor] || colorMap['teal'];
      
      let width = 1080;
      let height = 1080;
      
      if (format === 'story') { 
        width = 1080; 
        height = 1920; 
      } else if (format === 'feed') { 
        width = 1080; 
        height = 1350; 
      } else if (format === 'post') { 
        width = 1080; 
        height = 1080; // Строгий квадрат без полей
      } else if (format === 'event') { 
        width = 1920; 
        height = 1005; 
      }

      const fontConfig = [
        { name: 'Montserrat', data: montserratBlack, style: 'normal' as const, weight: 900 as const },
        { name: 'Montserrat', data: montserratBold, style: 'normal' as const, weight: 700 as const },
      ];

      // ==========================================
      // СЛАЙД > 0: КИНЕМАТОГРАФИЧНЫЙ ТЕКСТОВЫЙ ШАГ
      // ==========================================
      if (slide !== '0') {
        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                position: 'relative',
                fontFamily: 'Montserrat',
                backgroundColor: '#0d131a',
              }}
            >
              {/* Фото на фоне */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {/* Глубокая темная маска */}
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(13, 19, 26, 0.85)',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px', zIndex: 10 }}>
                {/* Стеклянная UI-плашка в стиле TourCard */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '50px',
                    padding: '80px',
                    border: `2px solid rgba(255, 255, 255, 0.05)`,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    flex: 1,
                  }}
                >
                   {/* Заголовок с неоновой иконкой */}
                   <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '24px', marginRight: '30px' }}>
                       <SparklesIcon color={brandColor} />
                     </div>
                     <span style={{ fontSize: '50px', color: brandColor, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                       {slideTitle}
                     </span>
                   </div>

                   {/* Основной текст */}
                   <span style={{ fontSize: '56px', color: 'white', fontWeight: 700, lineHeight: 1.4 }}>
                     {slideText}
                   </span>
                </div>

                {/* Брендинг внизу */}
                <div style={{ display: 'flex', marginTop: '50px', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  <span style={{ color: 'white', fontSize: '32px', fontWeight: 900, letterSpacing: '4px' }}>EVATUR.CLUB</span>
                </div>
              </div>
            </div>
          ), { width, height, fonts: fontConfig }
        );
      }

      // ==========================================
      // СЛАЙД 0: ГЛАВНАЯ ОБЛОЖКА (Раздельные форматы)
      // ==========================================

      // --- 1. ФОРМАТ STORY (1080x1920) ---
      if (format === 'story') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0d131a', position: 'relative', fontFamily: 'Montserrat' }}>
              {imageUrl && <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(to top, rgba(13, 19, 26, 1) 0%, rgba(13, 19, 26, 0.9) 30%, rgba(13, 19, 26, 0.4) 60%, rgba(13, 19, 26, 0) 100%)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '60px', zIndex: 10 }}>
                <div style={{ display: 'flex', backgroundColor: `${brandColor}cc`, border: `2px solid ${brandColor}`, padding: '16px 32px', borderRadius: '24px', color: 'white', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {categoryTitle}
                </div>
                {trigger && (
                  <div style={{ display: 'flex', backgroundColor: '#f43f5e', padding: '16px 32px', borderRadius: '24px', color: 'white', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                    🔥 {trigger}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, padding: '60px', zIndex: 10 }}>
                {date && (
                  <div style={{ display: 'flex', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(255, 255, 255, 0.1)', padding: '20px 40px', borderRadius: '24px' }}>
                      <CalendarIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '36px', fontWeight: 900, marginLeft: '16px', textTransform: 'uppercase' }}>{date}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MapPinIcon color={brandColor} />
                    <span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 700, marginLeft: '12px', textTransform: 'uppercase' }}>{location}</span>
                  </div>
                  <span style={{ color: '#475569', fontSize: '32px', margin: '0 24px' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ClockIcon color={brandColor} />
                    <span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 700, marginLeft: '12px', textTransform: 'uppercase' }}>{duration}</span>
                  </div>
                </div>

                <span style={{ color: 'white', fontSize: '100px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 40px 0', textTransform: 'uppercase' }}>{title}</span>

                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '60px' }}>
                    {tags.map((tag, idx) => (
                      <div key={idx} style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '2px solid rgba(255, 255, 255, 0.05)', padding: '16px 32px', borderRadius: '16px', color: '#cbd5e1', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                        # {tag}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', width: '100%', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '50px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '28px', color: '#94a3b8', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>Стоимость</span>
                     <div style={{ display: 'flex', alignItems: 'baseline' }}>
                       <span style={{ fontSize: '90px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{price || '???'}</span>
                       <span style={{ fontSize: '40px', color: brandColor, fontWeight: 900, marginLeft: '16px' }}>{currency}</span>
                     </div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '130px', height: '130px', backgroundColor: brandColor, borderRadius: '32px' }}>
                     <ArrowRightIcon color="#0f172a" />
                   </div>
                </div>
              </div>
            </div>
          ), { width, height, fonts: fontConfig }
        );
      }

      // --- 2. ФОРМАТ FEED (1080x1350) ---
      if (format === 'feed') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0d131a', position: 'relative', fontFamily: 'Montserrat' }}>
              {imageUrl && <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(to top, rgba(13, 19, 26, 1) 0%, rgba(13, 19, 26, 0.9) 40%, rgba(13, 19, 26, 0.4) 70%, rgba(13, 19, 26, 0) 100%)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '60px', zIndex: 10 }}>
                <div style={{ display: 'flex', backgroundColor: `${brandColor}cc`, border: `2px solid ${brandColor}`, padding: '16px 32px', borderRadius: '24px', color: 'white', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>{categoryTitle}</div>
                {trigger && <div style={{ display: 'flex', backgroundColor: '#f43f5e', padding: '16px 32px', borderRadius: '24px', color: 'white', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, padding: '60px', zIndex: 10 }}>
                {date && (
                  <div style={{ display: 'flex', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(255, 255, 255, 0.1)', padding: '20px 40px', borderRadius: '24px' }}>
                      <CalendarIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '36px', fontWeight: 900, marginLeft: '16px', textTransform: 'uppercase' }}>{date}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><MapPinIcon color={brandColor} /><span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 700, marginLeft: '12px', textTransform: 'uppercase' }}>{location}</span></div>
                  <span style={{ color: '#475569', fontSize: '32px', margin: '0 24px' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}><ClockIcon color={brandColor} /><span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 700, marginLeft: '12px', textTransform: 'uppercase' }}>{duration}</span></div>
                </div>

                <span style={{ color: 'white', fontSize: '80px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 40px 0', textTransform: 'uppercase' }}>{title}</span>

                <div style={{ display: 'flex', width: '100%', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '50px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '28px', color: '#94a3b8', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>Стоимость</span>
                     <div style={{ display: 'flex', alignItems: 'baseline' }}>
                       <span style={{ fontSize: '80px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{price || '???'}</span>
                       <span style={{ fontSize: '36px', color: brandColor, fontWeight: 900, marginLeft: '16px' }}>{currency}</span>
                     </div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '110px', height: '110px', backgroundColor: brandColor, borderRadius: '28px' }}><ArrowRightIcon color="#0f172a" /></div>
                </div>
              </div>
            </div>
          ), { width, height, fonts: fontConfig }
        );
      }

      // --- 3. ФОРМАТ POST (1080x1080 - Квадрат без полей) ---
      if (format === 'post') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0d131a', position: 'relative', fontFamily: 'Montserrat' }}>
              {imageUrl && <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(to top, rgba(13, 19, 26, 1) 0%, rgba(13, 19, 26, 0.9) 45%, rgba(13, 19, 26, 0.4) 75%, rgba(13, 19, 26, 0) 100%)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '50px', zIndex: 10 }}>
                <div style={{ display: 'flex', backgroundColor: `${brandColor}cc`, border: `2px solid ${brandColor}`, padding: '12px 28px', borderRadius: '20px', color: 'white', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>{categoryTitle}</div>
                {trigger && <div style={{ display: 'flex', backgroundColor: '#f43f5e', padding: '12px 28px', borderRadius: '20px', color: 'white', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, padding: '50px', zIndex: 10 }}>
                {date && (
                  <div style={{ display: 'flex', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(255, 255, 255, 0.1)', padding: '16px 32px', borderRadius: '20px' }}>
                      <CalendarIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '32px', fontWeight: 900, marginLeft: '16px', textTransform: 'uppercase' }}>{date}</span>
                    </div>
                  </div>
                )}
                
                <span style={{ color: 'white', fontSize: '70px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 30px 0', textTransform: 'uppercase' }}>{title}</span>

                <div style={{ display: 'flex', width: '100%', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '30px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '24px', color: '#94a3b8', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>Стоимость</span>
                     <div style={{ display: 'flex', alignItems: 'baseline' }}>
                       <span style={{ fontSize: '70px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{price || '???'}</span>
                       <span style={{ fontSize: '32px', color: brandColor, fontWeight: 900, marginLeft: '12px' }}>{currency}</span>
                     </div>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', backgroundColor: brandColor, borderRadius: '24px' }}><ArrowRightIcon color="#0f172a" /></div>
                </div>
              </div>
            </div>
          ), { width, height, fonts: fontConfig }
        );
      }

      // --- 4. ФОРМАТ EVENT (1920x1005) FB/Telegram ---
      if (format === 'event') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#0d131a', fontFamily: 'Montserrat' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '45%', height: '100%', padding: '80px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><MapPinIcon color={brandColor} /><span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 700, marginLeft: '12px', textTransform: 'uppercase' }}>{location}</span></div>
                  <span style={{ color: '#475569', fontSize: '32px', margin: '0 24px' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}><ClockIcon color={brandColor} /><span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 700, marginLeft: '12px', textTransform: 'uppercase' }}>{duration}</span></div>
                </div>

                <span style={{ color: 'white', fontSize: '90px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 60px 0', textTransform: 'uppercase' }}>{title}</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  {date && (
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(255, 255, 255, 0.1)', padding: '24px 40px', borderRadius: '24px' }}>
                      <CalendarIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '40px', fontWeight: 900, marginLeft: '16px', textTransform: 'uppercase' }}>{date}</span>
                    </div>
                  )}
                  {price && (
                    <div style={{ display: 'flex', alignItems: 'baseline', padding: '24px 0' }}>
                      <span style={{ fontSize: '70px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{price}</span>
                      <span style={{ fontSize: '36px', color: brandColor, fontWeight: 900, marginLeft: '16px' }}>{currency}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', width: '55%', height: '100%', position: 'relative' }}>
                {imageUrl ? <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', backgroundColor: '#1e293b' }} />}
                {trigger && <div style={{ position: 'absolute', top: '60px', right: '60px', display: 'flex', backgroundColor: '#f43f5e', padding: '20px 40px', borderRadius: '24px', color: 'white', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</div>}
              </div>
            </div>
          ), { width, height, fonts: fontConfig }
        );
      }
    }

    // ─── 2. СТАРЫЙ SEO ДВИЖОК ───
    const seoTitle = searchParams.get('title') || 'Туры и сплавы';
    const seoSubtitle = searchParams.get('subtitle') || 'Турклуб ЭВА';

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', border: '4px solid #8b5cf6', borderRadius: '30px', backgroundColor: '#0f172a', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)' }}>
            <span style={{ fontSize: '40px', color: '#a78bfa', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>{seoSubtitle}</span>
            <span style={{ fontSize: '75px', color: 'white', fontWeight: 'bold', textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>{seoTitle}</span>
          </div>
        </div>
      ), { width: 1200, height: 630 }
    );
  } catch (e: unknown) {
    return new Response('Failed to generate image', { status: 500 });
  }
});