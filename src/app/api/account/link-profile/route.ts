import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getLevelName } from '@/lib/constants/levels'; // ✅ ПОДКЛЮЧИЛИ ИСТОЧНИК ПРАВДЫ

export async function POST(request: NextRequest) {
  try {
    const { userId, phone } = await request.json();

    if (!userId || !phone) {
      return NextResponse.json({ error: 'Missing userId or phone' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.memberProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone,
        name: user.user_metadata?.name ?? null,
      },
      update: {
        name: undefined, 
      },
    });

    const linked = await prisma.booking.updateMany({
      where: {
        phone,
        memberId: null, 
      },
      data: {
        memberId: profile.id,
      },
    });

    if (linked.count > 0) {
      const stats = await prisma.booking.aggregate({
        where: { memberId: profile.id },
        _count: { id: true },
      });

      const bookingsWithTours = await prisma.booking.findMany({
        where: { memberId: profile.id },
        include: {
          tour: { select: { distance: true } },
        },
      });

      const totalKm = bookingsWithTours.reduce((sum, b) => {
        const km = parseFloat(b.tour?.distance ?? '0');
        return sum + (isNaN(km) ? 0 : km);
      }, 0);

      const tourCount = stats._count.id;
      
      // ✅ ИСПОЛЬЗУЕМ ФУНКЦИЮ ИЗ КОНФИГА ВМЕСТО ЛОКАЛЬНОГО ХАРДКОДА
      const level = getLevelName(tourCount);

      await prisma.memberProfile.update({
        where: { id: profile.id },
        data: {
          totalTours: tourCount,
          totalKm,
          level,
        },
      });
    }

    return NextResponse.json({ success: true, linkedBookings: linked.count });
  } catch (error) {
    console.error('[link-profile]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}