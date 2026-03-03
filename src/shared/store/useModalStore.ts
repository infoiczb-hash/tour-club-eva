import { create } from 'zustand';

interface ModalState {
  // Состояния
  isContactOpen: boolean;
  contactContext?: string;
  contactInitialTab?: string;
  
  isQuizOpen: boolean;

  // Экшены для ContactHub
  openContactModal: (context?: string, initialTab?: string) => void;
  closeContactModal: () => void;

  // Экшены для Quiz
  openQuizModal: () => void;
  closeQuizModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isContactOpen: false,
  contactContext: undefined,
  contactInitialTab: 'TOUR',
  
  isQuizOpen: false,

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
}));