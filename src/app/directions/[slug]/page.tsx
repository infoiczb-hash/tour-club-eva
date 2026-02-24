import { notFound } from 'next/navigation';

// --- УНИВЕРСАЛЬНЫЙ ДВИЖОК (Фолбэк) ---
import { getDirectionBySlug } from '@/data/directionsData';
import DirectionHero from '@/components/directions/DirectionHero';
import DirectionBento from '@/components/directions/DirectionBento';
import DirectionShowcase from '@/components/directions/DirectionShowcase';
import DirectionLeadMagnet from '@/components/directions/DirectionLeadMagnet';

// --- VIP-НАПРАВЛЕНИЯ (Твои эксклюзивные лендинги) ---
import KayakingLanding from '@/features/directions/kayaking/KayakingLanding';
import SupLanding from '@/features/directions/sup/SupLanding';
import KidsLanding from '@/features/directions/kids/KidsLanding';
import LocalLanding from '@/features/directions/local/LocalLanding';
import OrganizersLanding from '@/features/directions/organizers/OrganizersLanding';
import HikesLanding from '@/features/directions/hiking/HikesLanding';

import { Tour } from '@/features/tours/types';

interface PageProps {
  params: { slug: string };
}

export default async function DirectionPage({ params }: PageProps) {
  const { slug } = params;

  // Временная заглушка для туров (пока не подключим реальную БД/API)
  const tours: Tour[] = []; 

  // ==========================================
  // 1. ЭКСКЛЮЗИВНАЯ МАРШРУТИЗАЦИЯ (Твои папки)
  // ==========================================
  
  switch (slug) {
    case 'kayaking':
      return (
        <main className="min-h-screen bg-slate-950">
          <KayakingLanding tours={tours} />
        </main>
      );
      
    case 'sup':
      return (
        <main className="min-h-screen bg-slate-950">
          <SupLanding />
        </main>
      );
      
    case 'kids':
      return (
        <main className="min-h-screen bg-slate-950">
          <KidsLanding /> 
        </main>
      );
      
    case 'local':
      return (
        <main className="min-h-screen bg-slate-950">
          <LocalLanding tours={tours} />
        </main>
      );
      
    case 'organizers':
      return (
        <main className="min-h-screen bg-slate-950">
          <OrganizersLanding />
        </main>
      );
      
    case 'hiking':
      return (
        // Специальный "каменный" фон для гор
        <main className="min-h-screen bg-stone-950">
          <HikesLanding tours={tours} />
        </main>
      );
  }

  // ==========================================
  // 2. СТАНДАРТНАЯ МАРШРУТИЗАЦИЯ (Универсальный шаблон)
  // ==========================================
  // Если слаг не совпал ни с одним из VIP, ищем его в базе (на будущее)
  
  const data = getDirectionBySlug(slug);

  if (!data) {
    notFound(); 
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <DirectionHero data={data} />
      <DirectionBento data={data} />
      <DirectionShowcase data={data} />
      <DirectionLeadMagnet data={data} />
    </main>
  );
}