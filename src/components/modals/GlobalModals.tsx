"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useModalStore } from '@/shared/store/useModalStore';

// Ленивая загрузка клиентских модалок
const ContactHubModal = dynamic(() => import('./ContactHubModal'), { ssr: false });
const TourQuizModal = dynamic(() => import('./TourQuizModal'), { ssr: false });

// ✅ ИСПРАВЛЕНО: Добавили <any>, чтобы TypeScript перестал жестко требовать совпадения интерфейса здесь
const BookingModal = dynamic<any>(() => import('@/features/tours/components/TourDetails/BookingModal'), { ssr: false });

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
          initialTab={contactInitialTab as any} 
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