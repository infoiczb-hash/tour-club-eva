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
  slate: '#64748b'
};

// Компонент иконки для слайда "Что включено"
const CheckIcon = ({ color }: { color: string }) => (
  <svg 
    width="48" 
    height="48" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const GET = withRateLimitRoute(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'post' | 'feed' | 'story' | 'event' | null
    const slide = searchParams.get('slide') || '0';

    // ─── 1. НОВЫЙ SMM ДВИЖОК (Visual Engine 2.0) ───
    if (format === 'post' || format === 'feed' || format === 'story' || format === 'event') {
      const title = searchParams.get('title') || 'Секретный тур';
      const price = searchParams.get('price');
      const currency = searchParams.get('currency') || 'MDL';
      const date = searchParams.get('date');
      const imageUrl = searchParams.get('image');
      const category = searchParams.get('categoryColor') || 'teal';
      const trigger = searchParams.get('trigger'); // Триггерная фраза
      const desc = searchParams.get('desc') || 'Отправляемся в незабываемое приключение вместе с турклубом ЭВА. Нас ждут невероятные пейзажи и крутая компания!';
      
      const includedStr = searchParams.get('included') || 'Трансфер,Проживание,Питание,Снаряжение,Гид';
      const includedItems = includedStr.split(',').filter(Boolean).slice(0, 5);

      const brandColor = colorMap[category] || colorMap['teal'];
      
      let width = 1080;
      let height = 1080;
      
      if (format === 'story') { 
        width = 1080; 
        height = 1920; 
      } else if (format === 'feed' || format === 'post') { 
        width = 1080; 
        height = 1350; 
      } else if (format === 'event') { 
        width = 1920; 
        height = 1005; 
      }

      // ==========================================
      // СЛАЙД 1: Описание маршрута (Текстовый слайд)
      // ==========================================
      if (slide === '1') {
        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#0f172a',
                padding: '100px',
                fontFamily: 'sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: '#1e293b',
                  borderRadius: '60px',
                  padding: '80px',
                  border: `4px solid ${brandColor}50`,
                }}
              >
                 <div
                   style={{
                     display: 'flex',
                     fontSize: '48px',
                     color: brandColor,
                     fontWeight: 'bold',
                     textTransform: 'uppercase',
                     letterSpacing: '2px',
                     marginBottom: '40px'
                   }}
                 >
                   О маршруте
                 </div>
                 <div
                   style={{
                     display: 'flex',
                     fontSize: '64px',
                     color: 'white',
                     fontWeight: '900',
                     lineHeight: 1.2,
                     marginBottom: '60px'
                   }}
                 >
                   {title}
                 </div>
                 <div
                   style={{
                     display: 'flex',
                     fontSize: '42px',
                     color: '#cbd5e1',
                     lineHeight: 1.6
                   }}
                 >
                   {desc.length > 350 ? desc.substring(0, 350) + '...' : desc}
                 </div>
              </div>
            </div>
          ), { width, height }
        );
      }

      // ==========================================
      // СЛАЙД 2: Что включено (Список с буллитами)
      // ==========================================
      if (slide === '2') {
        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#0f172a',
                padding: '100px',
                fontFamily: 'sans-serif',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: '#1e293b',
                  borderRadius: '60px',
                  padding: '80px',
                  border: `4px solid ${brandColor}50`,
                }}
              >
                 <div
                   style={{
                     display: 'flex',
                     fontSize: '64px',
                     color: 'white',
                     fontWeight: '900',
                     textTransform: 'uppercase',
                     marginBottom: '80px'
                   }}
                 >
                   Что включено в тур?
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                   {includedItems.map((item, idx) => (
                     <div
                       key={idx}
                       style={{
                         display: 'flex',
                         alignItems: 'center',
                         backgroundColor: '#334155',
                         padding: '40px',
                         borderRadius: '30px'
                       }}
                     >
                       <div
                         style={{
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           width: '80px',
                           height: '80px',
                           backgroundColor: `${brandColor}30`,
                           borderRadius: '20px',
                           marginRight: '40px'
                         }}
                       >
                         <CheckIcon color={brandColor} />
                       </div>
                       <span style={{ fontSize: '48px', color: 'white', fontWeight: 'bold' }}>
                         {item.trim()}
                       </span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          ), { width, height }
        );
      }

      // ==========================================
      // СЛАЙД 0: ГЛАВНАЯ ОБЛОЖКА (По форматам)
      // ==========================================

      // --- 1. ФОРМАТ STORY (1080x1920) ---
      if (format === 'story') {
        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#0f172a',
                position: 'relative',
                fontFamily: 'sans-serif',
              }}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {/* Градиент снизу высотой 50% */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  backgroundImage: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.8) 50%, rgba(15,23,42,0) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '80px',
                }}
              >
                {trigger && (
                  <div style={{ display: 'flex', marginBottom: '30px' }}>
                    <div
                      style={{
                        display: 'flex',
                        backgroundColor: '#f43f5e',
                        padding: '16px 32px',
                        borderRadius: '100px',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                      }}
                    >
                      {trigger}
                    </div>
                  </div>
                )}

                {date && (
                  <div
                    style={{
                      display: 'flex',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '16px 32px',
                      borderRadius: '100px',
                      color: 'white',
                      fontSize: '36px',
                      fontWeight: 'bold',
                      marginBottom: '30px',
                      width: 'fit-content',
                    }}
                  >
                    📅 {date}
                  </div>
                )}

                <h1
                  style={{
                    color: 'white',
                    fontSize: '110px',
                    fontWeight: '900',
                    lineHeight: 1.1,
                    margin: '0 0 40px 0',
                  }}
                >
                  {title}
                </h1>

                {/* Желтая кнопка CTA */}
                {price && (
                  <div style={{ display: 'flex' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#eab308',
                        padding: '30px 60px',
                        borderRadius: '30px',
                        color: '#422006',
                        fontSize: '56px',
                        fontWeight: '900',
                      }}
                    >
                      {price} {currency}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ), { width, height }
        );
      }

      // --- 2. ФОРМАТ EVENT (1920x1005) FB/Telegram ---
      if (format === 'event') {
        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                height: '100%',
                backgroundColor: '#0f172a',
                fontFamily: 'sans-serif',
              }}
            >
              {/* ЛЕВЫЙ БЛОК (40%) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '40%',
                  height: '100%',
                  padding: '100px',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      backgroundColor: brandColor,
                      borderRadius: '20px',
                      color: 'white',
                      fontSize: '40px',
                      fontWeight: '900',
                      marginRight: '30px',
                    }}
                  >
                    E
                  </div>
                  <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold', letterSpacing: '2px' }}>
                    EVATUR.CLUB
                  </span>
                </div>

                {date && (
                  <div style={{ display: 'flex', color: brandColor, fontSize: '48px', fontWeight: 'bold', marginBottom: '30px' }}>
                    📅 {date}
                  </div>
                )}
                
                <h1 style={{ color: 'white', fontSize: '100px', fontWeight: '900', lineHeight: 1.1, margin: '0 0 60px 0' }}>
                  {title}
                </h1>
                
                {trigger && (
                  <div style={{ display: 'flex' }}>
                    <div
                      style={{
                        display: 'flex',
                        backgroundColor: '#f43f5e',
                        padding: '20px 40px',
                        borderRadius: '100px',
                        color: 'white',
                        fontSize: '40px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                      }}
                    >
                      🔥 {trigger}
                    </div>
                  </div>
                )}
              </div>
              
              {/* ПРАВЫЙ БЛОК (60%) */}
              <div style={{ display: 'flex', width: '60%', height: '100%', position: 'relative' }}>
                {imageUrl ? (
                  <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#1e293b' }} />
                )}
              </div>
            </div>
          ), { width, height }
        );
      }

      // --- 3. ФОРМАТ POST / FEED (1080x1350) ---
      return new ImageResponse(
        (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: '#0f172a',
              fontFamily: 'sans-serif',
            }}
          >
            {/* ВЕРХ (60%) - ФОТО */}
            <div style={{ display: 'flex', width: '100%', height: '60%', position: 'relative' }}>
              {imageUrl ? (
                <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#1e293b' }} />
              )}
              
              {/* Плашка триггера прямо на фото */}
              {trigger && (
                <div style={{ position: 'absolute', top: '60px', right: '60px', display: 'flex' }}>
                  <div
                    style={{
                      display: 'flex',
                      backgroundColor: '#f43f5e',
                      padding: '20px 40px',
                      borderRadius: '100px',
                      color: 'white',
                      fontSize: '36px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                    }}
                  >
                    {trigger}
                  </div>
                </div>
              )}
            </div>

            {/* НИЗ (40%) - ПЛОТНЫЙ БЛОК С ДЕТАЛЯМИ */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '40%',
                padding: '60px 80px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {date && (
                  <div style={{ display: 'flex', color: brandColor, fontSize: '42px', fontWeight: 'bold', marginBottom: '20px' }}>
                    📅 {date}
                  </div>
                )}
                <h1 style={{ color: 'white', fontSize: '90px', fontWeight: '900', lineHeight: 1.1, margin: 0 }}>
                  {title.length > 40 ? title.substring(0, 40) + '...' : title}
                </h1>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '60px',
                        height: '60px',
                        backgroundColor: brandColor,
                        borderRadius: '16px',
                        color: 'white',
                        fontSize: '30px',
                        fontWeight: '900',
                        marginRight: '20px',
                      }}
                    >
                      E
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '36px', fontWeight: 'bold', letterSpacing: '2px' }}>
                      EVATUR.CLUB
                    </span>
                 </div>
                 
                 {price && (
                   <div
                     style={{
                       display: 'flex',
                       backgroundColor: 'white',
                       padding: '20px 40px',
                       borderRadius: '30px',
                       color: '#0f172a',
                       fontSize: '56px',
                       fontWeight: '900',
                     }}
                   >
                     {price} {currency}
                   </div>
                 )}
              </div>
            </div>
          </div>
        ), { width, height }
      );
    }

    // ─── 2. СТАРЫЙ SEO ДВИЖОК (Совместимость для сайта) ───
    const seoTitle = searchParams.get('title') || 'Туры и сплавы';
    const seoSubtitle = searchParams.get('subtitle') || 'Турклуб ЭВА';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 80px',
              border: '4px solid #8b5cf6',
              borderRadius: '30px',
              backgroundColor: '#0f172a',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
            }}
          >
            <span style={{ fontSize: '40px', color: '#a78bfa', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {seoSubtitle}
            </span>
            <span style={{ fontSize: '75px', color: 'white', fontWeight: 'bold', textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>
              {seoTitle}
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: unknown) {
    return new Response('Failed to generate image', { status: 500 });
  }
});