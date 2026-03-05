import { create } from 'zustand';
import { Tour } from '@/features/tours/types';

interface ModalState {
  // Состояния ContactHub
  isContactOpen: boolean;
  contactContext?: string;
  contactInitialTab?: string;
  
  // Состояния Quiz
  isQuizOpen: boolean;

  // Состояния бронирования
  isBookingOpen: boolean;
  bookingTour?: Tour | null;
  bookingInitialDate?: string;
  bookingInitialDateId?: string;

  // Экшены для ContactHub
  openContactModal: (context?: string, initialTab?: string) => void;
  closeContactModal: () => void;

  // Экшены для Quiz
  openQuizModal: () => void;
  closeQuizModal: () => void;

  // Экшены для бронирования
  openBookingModal: (tour: Tour, date?: string, dateId?: string) => void;
  closeBookingModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isContactOpen: false,
  contactContext: undefined,
  contactInitialTab: 'TOUR',
  
  isQuizOpen: false,

  isBookingOpen: false,
  bookingTour: null,
  bookingInitialDate: undefined,
  bookingInitialDateId: undefined,

  openContactModal: (context, initialTab = 'TOUR') => set({ 
    isContactOpen: true, 
    contactContext: context, 
    contactInitialTab: initialTab 
  }),
  closeContactModal: () => set({ 
    isContactOpen: false,
    contactContext: undefined 
  }),

  openQuizModal: () => set({ isQuizOpen: true }),
  closeQuizModal: () => set({ isQuizOpen: false }),

  // Открываем модалку бронирования и прокидываем тур + конкретную дату
  openBookingModal: (tour, date, dateId) => set({
    isBookingOpen: true,
    bookingTour: tour,
    bookingInitialDate: date,
    bookingInitialDateId: dateId
  }),
  
  // Закрываем модалку бронирования
  closeBookingModal: () => set({
    isBookingOpen: false,
    bookingInitialDate: undefined,
    bookingInitialDateId: undefined
  })
}));