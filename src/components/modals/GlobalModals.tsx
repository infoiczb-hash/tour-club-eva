"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useModalStore } from '@/shared/store/useModalStore';
import { Tour } from '@/features/tours/types'; // ✅ ИМПОРТИРУЕМ СТРОГИЙ ТИП ТУРА

// ✅ СТРОГАЯ ТИПИЗАЦИЯ ВМЕСТО ANY
type TabType = 'TOUR' | 'HR' | 'BLOG' | 'B2B' | 'REVIEW' | 'HELP';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  initialDate?: string;
  initialDateId?: string;
}

// Ленивая загрузка клиентских модалок
const ContactHubModal = dynamic(() => import('./ContactHubModal'), { ssr: false });
const TourQuizModal = dynamic(() => import('./TourQuizModal'), { ssr: false });

// ✅ УБРАЛИ <any>, ИСПОЛЬЗУЕМ СТРОГИЙ ИНТЕРФЕЙС
const BookingModal = dynamic<BookingModalProps>(() => import('@/features/tours/components/TourDetails/BookingModal'), { ssr: false });

export default function GlobalModals() {
  const { 
    isContactOpen, closeContactModal, contactContext, contactInitialTab,
    isQuizOpen, closeQuizModal,
    isBookingOpen, closeBookingModal, bookingTour, bookingInitialDate, bookingInitialDateId
  } = useModalStore();

  return (
    <>
      {isContactOpen && (
        <ContactHubModal 
          isOpen={isContactOpen} 
          onClose={closeContactModal} 
          // ✅ Убрали as any, приводим к строгому типу или даем фолбэк
          initialTab={(contactInitialTab as TabType) || 'TOUR'} 
          tourContext={contactContext}
        />
      )}
      
      {isQuizOpen && (
        <TourQuizModal 
          isOpen={isQuizOpen} 
          onClose={closeQuizModal} 
        />
      )}

      {/* 🔥 Глобальная модалка бронирования */}
      {isBookingOpen && bookingTour && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={closeBookingModal}
          tour={bookingTour}
          initialDate={bookingInitialDate} 
          initialDateId={bookingInitialDateId}
        />
      )}
    </>
  );
}