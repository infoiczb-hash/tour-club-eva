import { ImageResponse } from 'next/og';

// Vercel будет запускать этот код на самых быстрых серверах (Edge)
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Получаем название тура из ссылки, либо ставим текст по умолчанию
    const title = searchParams.get('title') || 'Авторские туры и сплавы';
    const subtitle = searchParams.get('subtitle') || 'Турклуб ЭВА';

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
            backgroundColor: '#020617', // slate-950 (как фон твоего сайта)
            fontFamily: 'sans-serif',
          }}
        >
          {/* Внутренняя карточка */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 80px',
              border: '4px solid #8b5cf6', // violet-500
              borderRadius: '30px',
              backgroundColor: '#0f172a', // slate-900
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
            }}
          >
            <span style={{ fontSize: '40px', color: '#a78bfa', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {subtitle}
            </span>
            <span style={{ fontSize: '75px', color: 'white', fontWeight: 'bold', textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>
              {title}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200, // Стандартный размер для Telegram/Facebook
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response('Failed to generate image', { status: 500 });
  }
}