import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, phone } = await request.json();

    if (!userId || !phone) {
      return NextResponse.json({ error: 'Missing userId or phone' }, { status: 400 });
    }

    // Проверяем что запрос идёт от залогиненного пользователя с этим userId
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert MemberProfile — создаём если нет, обновляем если есть
    const profile = await prisma.memberProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone,
        name: user.user_metadata?.name ?? null,
      },
      update: {
        // При повторном входе обновляем только если поле пустое
        name: undefined, // не перезаписываем имя
      },
    });

    // Привязываем все исторические Booking по номеру телефона
    const linked = await prisma.booking.updateMany({
      where: {
        phone,
        memberId: null, // только ещё не привязанные
      },
      data: {
        memberId: profile.id,
      },
    });

    // Обновляем счётчик туров в профиле
    if (linked.count > 0) {
      const stats = await prisma.booking.aggregate({
        where: { memberId: profile.id },
        _count: { id: true },
      });

      // Считаем км: берём distance из связанных туров
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

      // Определяем уровень
      const tourCount = stats._count.id;
      const level = getLevel(tourCount);

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

// ─── уровни участника ───────────────────────────────────────────────
function getLevel(tourCount: number): string {
  if (tourCount >= 30) return 'Легенда клуба';
  if (tourCount >= 15) return 'Ветеран';
  if (tourCount >= 7)  return 'Бывалый';
  if (tourCount >= 3)  return 'Походник';
  return 'Первопроходец';
}
