import { BookingGroup, Boat, AssignmentResult, TicketType, Passenger, BoatPassenger } from './types';

export function computePaidSeats(booking: any): number {
  let paid = (booking.ticketsAdult || 0) +
             (booking.ticketsChild || 0) +
             (booking.ticketsMember || 0);
  if (booking.ticketsFamily) paid += booking.ticketsFamily * 3;
  return paid;
}

function mapTicketType(typeStr?: string): TicketType {
  const lower = typeStr?.toLowerCase() || '';
  if (lower.includes('взрослый')) return 'adult';
  if (lower.includes('клубный') || lower.includes('член клуба')) return 'member';
  if (lower.includes('детский') || lower.includes('ребёнок')) return 'child';
  if (lower.includes('семейный')) return 'family';
  return 'adult';
}

export function parseBookingGroup(booking: any): BookingGroup {
  const paidSeats = computePaidSeats(booking);
  const comment = booking.comment || '';

  const passengers: Passenger[] = [];
  const guests = Array.isArray(booking.guests) ? booking.guests : [];

  if (guests.length > 0) {
    guests.forEach((g: any, i: number) => {
      passengers.push({
        name: g.name || `${booking.name} (Гость ${i + 1})`,
        ticketType: mapTicketType(g.ticketType || g.type),
        age: g.age ? Number(g.age) : undefined,
        hasDog: !!g.hasDog,
      });
    });
  } else {
    for (let i = 0; i < (booking.ticketsAdult || 0); i++) passengers.push({ name: `${booking.name} (Взр)`, ticketType: 'adult' });
    for (let i = 0; i < (booking.ticketsChild || 0); i++) passengers.push({ name: `${booking.name} (Дет)`, ticketType: 'child' });
    for (let i = 0; i < (booking.ticketsMember || 0); i++) passengers.push({ name: `${booking.name} (Клуб)`, ticketType: 'member' });
    for (let i = 0; i < (booking.ticketsFamily || 0); i++) {
      passengers.push({ name: `${booking.name} (Сем-Взр)`, ticketType: 'family' });
      passengers.push({ name: `${booking.name} (Сем-Взр)`, ticketType: 'family' });
      passengers.push({ name: `${booking.name} (Сем-Реб)`, ticketType: 'family' });
    }
  }

  let hasChildUnder7 = /ребёнок\s*до\s*7/i.test(comment) || passengers.some(p => p.age !== undefined && p.age < 7);
  let hasDog = /собака/i.test(comment) || passengers.some(p => p.hasDog);

  return {
    bookingId: booking.id,
    name: booking.name || 'Без имени',
    comment,
    passengers,
    paidSeats,
    hasChildUnder7,
    hasDog,
    phone: booking.phone,
    memberName: booking.member?.name,
    adultsCount: booking.ticketsAdult || 0,
    childCount: booking.ticketsChild || 0,
    memberCount: booking.ticketsMember || 0,
    familyCount: booking.ticketsFamily || 0,
  };
}

export function assignBoatsWithPassengers(
  groups: BookingGroup[],
  k3Count: number,
  k2Count: number,
  guidesCount: number
): AssignmentResult {
  const warnings: string[] = [];
  const boats: Boat[] = [];
  const unassignedPassengers: BoatPassenger[] = [];

  for (let i = 1; i <= k3Count; i++) boats.push({ id: `K3-${i}`, type: 'K3', index: i, paidCapacity: 3, bonusCapacity: 1, assignedPassengers: [], guideAssigned: false });
  for (let i = 1; i <= k2Count; i++) boats.push({ id: `K2-${i}`, type: 'K2', index: i, paidCapacity: 2, bonusCapacity: 1, assignedPassengers: [], guideAssigned: false });

  const sortedGroups = [...groups].sort((a, b) => b.paidSeats - a.paidSeats || (b.hasChildUnder7 ? -1 : 1));

  for (const group of sortedGroups) {
    if (group.paidSeats > 3) {
      warnings.push(`⚠️ ${group.name} (${group.paidSeats} чел.): Группа превышает размер лодки. Пассажиры оставлены на берегу для ручного распределения.`);
      group.passengers.forEach((p, idx) => {
        unassignedPassengers.push({
          bookingId: group.bookingId,
          passengerId: `${group.bookingId}-${idx}`,
          name: p.name,
          isChild: p.ticketType === 'child' || (p.age !== undefined && p.age < 7)
        });
      });
      continue;
    }

    const targetBoat = boats.find(b => (b.paidCapacity - b.assignedPassengers.length) >= group.paidSeats);

    if (targetBoat) {
      group.passengers.forEach((p, idx) => {
        targetBoat.assignedPassengers.push({
          bookingId: group.bookingId,
          passengerId: `${group.bookingId}-${idx}`,
          name: p.name,
          isChild: p.ticketType === 'child' || (p.age !== undefined && p.age < 7)
        });
      });
    } else {
      warnings.push(`❌ Группа ${group.name} не поместилась. Пассажиры оставлены на берегу.`);
      group.passengers.forEach((p, idx) => {
        unassignedPassengers.push({
          bookingId: group.bookingId,
          passengerId: `${group.bookingId}-${idx}`,
          name: p.name,
          isChild: p.ticketType === 'child' || (p.age !== undefined && p.age < 7)
        });
      });
    }
  }

  const nonEmptyBoats = boats.filter(b => b.assignedPassengers.length > 0);
  for (let i = 0; i < Math.min(guidesCount, nonEmptyBoats.length); i++) {
    nonEmptyBoats[i].guideAssigned = true;
  }

  return { boats, unassignedPassengers, warnings };
}