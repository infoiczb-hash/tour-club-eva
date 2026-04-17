// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const colorMap: Record<string, string> = {
  teal: '#14b8a6', amber: '#f59e0b', rose: '#f43f5e', emerald: '#10b981',
  violet: '#8b5cf6', blue: '#3b82f6', slate: '#64748b'
};

// === ИКОНКИ ДЛЯ UI 2026 ===
const MapPinIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const ClockIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const CalendarIcon = ({ color }: { color: string }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);
const ArrowRightIcon = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
const SparklesIcon = ({ color }: { color: string }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
);
const CheckIcon = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const FlagIcon = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
);
const TicketIcon = ({ color }: { color: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ✅ ВЕКТОР 1: Безопасное скачивание кастомного шрифта
    let fontConfig: any = undefined;
    try {
      const fontRes = await fetch('https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70f-m-Y.ttf');
      if (fontRes.ok) {
        const fontData = await fontRes.arrayBuffer();
        fontConfig = [{ name: 'Montserrat', data: fontData, weight: 900 as const }];
      } else {
        console.warn('Шрифт недоступен, Vercel использует системный');
      }
    } catch (e) {
      console.warn('Ошибка загрузки шрифта:', e);
    }

    const format = searchParams.get('format'); 
    const slide = searchParams.get('slide') || '0';

    if (format === 'post' || format === 'feed' || format === 'story' || format === 'event') {
      const title = searchParams.get('title') || 'Секретный тур';
      const price = searchParams.get('price');
      const currency = searchParams.get('currency') || 'MDL';
      const date = (searchParams.get('date') || '').toUpperCase(); // Дата капсом
      
      // ✅ ПРОБЛЕМА 1: ПРЕМИАЛЬНЫЙ ПАРСЕР ДАТЫ
      let formattedDate = date;
      if (date && date.includes('-') && date.split('-').length >= 3) {
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            const day = d.getDate();
            const months = ['ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ', 'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ'];
            const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
            formattedDate = `${day} ${months[d.getMonth()]} (${days[d.getDay()]})`;
          }
        } catch(e) {}
      }

      const imageUrl = searchParams.get('image');
      const categoryColor = searchParams.get('categoryColor') || 'teal';
      const categoryTitle = searchParams.get('categoryTitle') || 'ТУР';
      const trigger = searchParams.get('trigger'); 
      
      const location = searchParams.get('location') || 'Локация уточняется';
      const duration = searchParams.get('duration') || '1 день';
      const tagsStr = searchParams.get('tags') || '';
      const tags = tagsStr.split(',').filter(Boolean).slice(0, 3);

      const slideTitle = (searchParams.get('slideTitle') || '').toUpperCase();
      const slideText = searchParams.get('slideText') || '';

      const brandColor = colorMap[categoryColor] || colorMap['teal'];
      
      let width = 1080;
      let height = 1350; 
      
      if (format === 'story') { width = 1080; height = 1920; } 
      else if (format === 'post') { width = 1080; height = 1080; } 
      else if (format === 'event') { width = 1920; height = 1005; } // Оставляем FB Event

      // ==========================================
      // ✅ ЛОГИКА ШАБЛОНОВ СЛАЙДОВ (slide !== '0')
      // ПОЛНОСТЬЮ ИДЕНТИЧНО ОРИГИНАЛУ
      // ==========================================
      if (slide !== '0') {
        const bgOverlay = 'rgba(15, 23, 42, 0.9)'; // #0f172a с легкой прозрачностью
        
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0f172a', position: 'relative', fontFamily: 'Montserrat' }}>
              {imageUrl && <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bgOverlay }} />

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px', zIndex: 10 }}>
                
                {/* 1. ШАБЛОН: АФИША (Календарь на месяц) */}
                {slideTitle.includes('АФИША') || slideTitle.includes('РАСПИСАНИЕ') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <span style={{ fontSize: '60px', color: brandColor, fontWeight: 900, marginBottom: '60px' }}>{slideTitle}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {slideText.split('|').map((item, i) => {
                        const [d, n, p] = item.split(':').map(s => s?.trim());
                        if (!d || !n) return null;
                        return (
                          <div key={i} style={{ display: 'flex', backgroundColor: '#1e293b', borderRadius: '30px', padding: '30px', alignItems: 'center', border: '2px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: brandColor, padding: '20px 25px', borderRadius: '20px', minWidth: '140px', marginRight: '40px' }}>
                               <span style={{ color: '#0f172a', fontSize: '32px', fontWeight: 900, textAlign: 'center' }}>{d}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <span style={{ color: 'white', fontSize: '40px', fontWeight: 900, marginBottom: '10px' }}>{n}</span>
                              <span style={{ color: '#94a3b8', fontSize: '28px', fontWeight: 700 }}>{p || 'Места есть'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : 
                
                /* 2. ШАБЛОН: ДЕТАЛИ (Плитки 2х2) */
                slideTitle.includes('ДЕТАЛИ') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <span style={{ fontSize: '60px', color: brandColor, fontWeight: 900, marginBottom: '60px' }}>{slideTitle}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                      {slideText.split('|').map((item, i) => {
                        const parts = item.split(':');
                        if (parts.length < 2) return null;
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', width: '48%', backgroundColor: '#1e293b', padding: '40px', borderRadius: '32px', border: '2px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: '#94a3b8', fontSize: '24px', fontWeight: 900, marginBottom: '20px', textTransform: 'uppercase' }}>{parts[0].trim()}</span>
                            <span style={{ color: 'white', fontSize: '44px', fontWeight: 900 }}>{parts[1].trim()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : 
                
                /* 3. ШАБЛОН: ПРОГРАММА (Таймлайн) */
                slideTitle.includes('ПРОГРАММА') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <span style={{ fontSize: '60px', color: brandColor, fontWeight: 900, marginBottom: '60px' }}>{slideTitle}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b', padding: '50px', borderRadius: '40px', border: '2px solid rgba(255,255,255,0.05)' }}>
                      {slideText.split('|').map((item, i) => {
                        const parts = item.split('-');
                        if (parts.length < 2) return null;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '30px' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: brandColor, marginBottom: '10px' }} />
                              <div style={{ width: '4px', height: '100px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginTop: '-5px' }}>
                              <span style={{ color: brandColor, fontSize: '32px', fontWeight: 900, marginBottom: '10px' }}>{parts[0].trim()}</span>
                              <span style={{ color: 'white', fontSize: '36px', fontWeight: 700 }}>{parts[1].trim()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : 
                
                /* 4. ШАБЛОН: ВПЕЧАТЛЕНИЯ / ВКЛЮЧЕНО (Список с галочками) */
                (slideTitle.includes('ВПЕЧАТЛЕНИЯ') || slideTitle.includes('ВКЛЮЧЕНО') || slideTitle.includes('С СОБОЙ')) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px' }}>
                      <SparklesIcon color={brandColor} />
                      <span style={{ fontSize: '60px', color: 'white', fontWeight: 900, marginLeft: '20px' }}>{slideTitle}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      {slideText.split('-').filter(t => t.trim()).map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', borderRadius: '20px', padding: '16px', marginRight: '30px' }}>
                            <CheckIcon color={brandColor} />
                          </div>
                          <span style={{ color: '#cbd5e1', fontSize: '40px', fontWeight: 700, lineHeight: 1.4, flex: 1, marginTop: '8px' }}>{t.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : 
                
                /* 5. ШАБЛОН ПО УМОЛЧАНИЮ (Текст по центру) */
                (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                     <span style={{ fontSize: '50px', color: brandColor, fontWeight: 900, letterSpacing: '2px', marginBottom: '40px' }}>{slideTitle}</span>
                     <span style={{ fontSize: '64px', color: 'white', fontWeight: 900, lineHeight: 1.4 }}>{slideText}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                  <span style={{ color: 'white', fontSize: '28px', fontWeight: 900, letterSpacing: '6px' }}>EVATUR.CLUB</span>
                </div>
              </div>
            </div>
          ), { width, height, fonts: fontConfig }
        );
      }

      // ==========================================
      // СЛАЙД 0: ГЛАВНЫЕ ОБЛОЖКИ ПО ФОРМАТАМ
      // ==========================================

      // --- 1. ФОРМАТ STORY (1080x1920) ---
      if (format === 'story') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
              {imageUrl && <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              
              {/* ✅ ПРОБЛЕМА 2: ЖЕСТКОЕ ЗАТЕМНЕНИЕ */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.3) 30%, rgba(15,23,42,0.8) 70%, rgba(15,23,42,1) 100%)' }} />

              {/* ✅ ПРОБЛЕМА 4: SAFE ZONES И РАСТЯГИВАНИЕ */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '140px 80px 100px 80px', position: 'relative', zIndex: 10 }}>
                
                {/* Триггер и Категория прижаты наверх */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {trigger && (
                    <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '14px 32px', borderRadius: '100px', marginBottom: '40px', alignSelf: 'flex-start', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '12px', height: '40px', backgroundColor: brandColor, marginRight: '20px', borderRadius: '4px' }} />
                    <span style={{ fontSize: '36px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 5px 20px rgba(0,0,0,0.8)' }}>{categoryTitle}</span>
                  </div>
                </div>

                {/* Заголовок и Теги по центру (flex: 1) */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                  <h1 style={{ color: 'white', fontSize: '110px', fontWeight: 900, lineHeight: 0.95, margin: '0 0 50px 0', textTransform: 'uppercase', textShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.6)' }}>
                    {title}
                  </h1>

                  {/* ✅ ПРОБЛЕМА 5: ТЕГИ ВЕЗДЕ */}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {tags.map((tag, idx) => (
                        <div key={idx} style={{ display: 'flex', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '14px 28px', borderRadius: '16px', color: 'white', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}># {tag}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Инфо и Цена прижаты вниз */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                  {/* ИНФО-ПАНЕЛЬ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '40px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '30px 45px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.15)', alignSelf: 'flex-start', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    {formattedDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <CalendarIcon color={brandColor} />
                        <span style={{ color: 'white', fontSize: '36px', fontWeight: 900 }}>{formattedDate}</span>
                      </div>
                    )}
                    {formattedDate && <div style={{ width: '2px', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <MapPinIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '36px', fontWeight: 900 }}>{location}</span>
                    </div>
                    {duration && (
                      <>
                        <div style={{ width: '2px', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <ClockIcon color={brandColor} />
                          <span style={{ color: 'white', fontSize: '36px', fontWeight: 900 }}>{duration}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ✅ ПРОБЛЕМА 3: КРУГЛАЯ СТРЕЛКА */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>Стоимость тура</span>
                       <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                         <span style={{ fontSize: '100px', color: 'white', fontWeight: 900, lineHeight: 1, textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>{Number(price).toLocaleString()}</span>
                         <span style={{ fontSize: '44px', color: brandColor, fontWeight: 900 }}>{currency}</span>
                       </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50px', backgroundColor: brandColor, boxShadow: `0 10px 40px ${brandColor}80` }}>
                       <ArrowRightIcon color="#0f172a" />
                     </div>
                  </div>
                </div>

              </div>
            </div>
          ), { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
        );
      }

      // --- 2. ФОРМАТ POST / FEED (1080x1350 или 1080x1080) ---
      if (format === 'feed' || format === 'post') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#020617', position: 'relative', fontFamily: 'Montserrat' }}>
              {imageUrl && <img src={imageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              
              {/* ✅ ПРОБЛЕМА 2: ЖЕСТКОЕ ЗАТЕМНЕНИЕ */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0) 0%, rgba(15,23,42,0.3) 30%, rgba(15,23,42,0.8) 70%, rgba(15,23,42,1) 100%)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '80px', position: 'relative', zIndex: 10 }}>
                
                {/* Триггер и Категория прижаты наверх */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {trigger && (
                    <div style={{ display: 'flex', backgroundColor: '#f59e0b', padding: '12px 28px', borderRadius: '100px', marginBottom: '40px', alignSelf: 'flex-start', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px' }}>🔥 {trigger}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '12px', height: '40px', backgroundColor: brandColor, marginRight: '20px', borderRadius: '4px' }} />
                    <span style={{ fontSize: '36px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 5px 20px rgba(0,0,0,0.8)' }}>{categoryTitle}</span>
                  </div>
                </div>

                {/* Заголовок и Теги по центру */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                  <h1 style={{ color: 'white', fontSize: '96px', fontWeight: 900, lineHeight: 0.95, margin: '0 0 50px 0', textTransform: 'uppercase', textShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                    {title}
                  </h1>

                  {/* ✅ ПРОБЛЕМА 5: ТЕГИ ВЕЗДЕ */}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {tags.map((tag, idx) => (
                        <div key={idx} style={{ display: 'flex', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '12px 24px', borderRadius: '14px', color: 'white', fontSize: '26px', fontWeight: 900, textTransform: 'uppercase', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}># {tag}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Инфо и Цена прижаты вниз */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  {/* ИНФО-ПАНЕЛЬ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '40px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '30px 45px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.15)', alignSelf: 'flex-start', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    {formattedDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <CalendarIcon color={brandColor} />
                        <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{formattedDate}</span>
                      </div>
                    )}
                    {formattedDate && <div style={{ width: '2px', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <MapPinIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{location}</span>
                    </div>
                    {duration && (
                      <>
                        <div style={{ width: '2px', height: '50px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <ClockIcon color={brandColor} />
                          <span style={{ color: 'white', fontSize: '34px', fontWeight: 900 }}>{duration}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ✅ ПРОБЛЕМА 3: КРУГЛАЯ СТРЕЛКА */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>Стоимость тура</span>
                       <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px' }}>
                         <span style={{ fontSize: '90px', color: 'white', fontWeight: 900, lineHeight: 1, textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>{Number(price).toLocaleString()}</span>
                         <span style={{ fontSize: '40px', color: brandColor, fontWeight: 900 }}>{currency}</span>
                       </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', borderRadius: '45px', backgroundColor: brandColor, boxShadow: `0 10px 40px ${brandColor}80` }}>
                       <ArrowRightIcon color="#0f172a" />
                     </div>
                  </div>
                </div>

              </div>
            </div>
          ), { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
        );
      }

      // --- 3. ФОРМАТ EVENT (1920x1005) FB/Telegram (ОРИГИНАЛ ИЗ ТВОЕГО ФАЙЛА) ---
      if (format === 'event') {
        return new ImageResponse(
          (
            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#0d131a', fontFamily: 'Montserrat' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '45%', height: '100%', padding: '80px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}><MapPinIcon color={brandColor} /><span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 900, marginLeft: '12px', textTransform: 'uppercase' }}>{location}</span></div>
                  <span style={{ color: '#475569', fontSize: '32px', margin: '0 24px' }}>•</span>
                  <div style={{ display: 'flex', alignItems: 'center' }}><ClockIcon color={brandColor} /><span style={{ color: '#cbd5e1', fontSize: '32px', fontWeight: 900, marginLeft: '12px', textTransform: 'uppercase' }}>{duration}</span></div>
                </div>

                <h1 style={{ color: 'white', fontSize: '90px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 60px 0', textTransform: 'uppercase' }}>{title}</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  {formattedDate && (
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: `2px solid ${brandColor}`, padding: '24px 40px', borderRadius: '16px' }}>
                      <CalendarIcon color={brandColor} />
                      <span style={{ color: 'white', fontSize: '40px', fontWeight: 900, marginLeft: '16px' }}>{formattedDate}</span>
                    </div>
                  )}
                  {price && (
                    <div style={{ display: 'flex', alignItems: 'baseline', padding: '24px 0' }}>
                      <span style={{ fontSize: '64px', color: 'white', fontWeight: 900, lineHeight: 1 }}>{price}</span>
                      <span style={{ fontSize: '36px', color: brandColor, fontWeight: 900, marginLeft: '16px' }}>{currency}</span>
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
          ), { width, height, fonts: fontConfig, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
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
}