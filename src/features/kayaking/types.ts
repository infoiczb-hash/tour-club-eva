export type TicketType = 'adult' | 'child' | 'member' | 'family';

export interface Passenger {
  name: string;
  ticketType: TicketType;
  age?: number;
  hasDog?: boolean;
}

export interface BookingGroup {
  bookingId: string;
  shortId: number;
  name: string;
  comment: string | null;
  passengers: Passenger[];
  paidSeats: number;
  hasChildUnder7: boolean;
  hasDog: boolean;
  phone?: string;
  memberName?: string;
  adultsCount: number;
  childCount: number;
  memberCount: number;
  familyCount: number;
}

export interface BoatPassenger {
  bookingId: string;
  passengerId: string;
  shortId: number;
  name: string;
  isChild: boolean;
  isChildUnder7: boolean; // Добавили
  hasDog: boolean;        // Добавили
}

export interface Boat {
  id: string; // K3-1, K2-1
  type: 'K2' | 'K3';
  index: number;
  paidCapacity: number;
  bonusCapacity: number;
  assignedPassengers: BoatPassenger[];
  guideAssigned: boolean;
}

export interface Assignment {
  bookingId: string;
  passengerId: string;
  passengerName: string;
  boatType: string;
  boatIndex: number;
}

export interface AssignmentResult {
  boats: Boat[];
  unassignedPassengers: BoatPassenger[];
  warnings: string[];
}