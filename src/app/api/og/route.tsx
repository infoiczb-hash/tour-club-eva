import { ImageResponse } from 'next/og';
import { withRateLimitRoute } from '@/lib/rate-limit-server';

export const runtime = 'edge';

export const GET = withRateLimitRoute(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Туры и сплавы';
    const subtitle = searchParams.get('subtitle') || 'Турклуб ЭВА';

    return new ImageResponse(
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
            {subtitle}
          </span>
          <span style={{ fontSize: '75px', color: 'white', fontWeight: 'bold', textAlign: 'center', maxWidth: '900px', lineHeight: 1.2 }}>
            {title}
          </span>
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  } catch (e: unknown)  {
    return new Response('Failed to generate image', { status: 500 });
  }
});