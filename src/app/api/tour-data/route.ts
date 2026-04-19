import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Явно указываем Node.js

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing tour id' }, { status: 400 });
  }

  try {
    const tour = await prisma.tour.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        program: true,
        checklist: true,
        includedDetailed: true,
        included: true,
        meetingPoint: true,
        location: true,
        duration: true,
        route: true,
        guide: { select: { name: true } },
        category: { select: { color: true, title: true } },
        coverImage: true,
        price: true,
        currency: true,
      },
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Кэшируем на 1 час на CDN (если используете Vercel)
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');

    return NextResponse.json(tour, { headers });
  } catch (error) {
    console.error('[tour-data] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}