"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useModalStore } from '@/shared/store/useModalStore';

// Ленивая загрузка тяжелых модалок (Они не попадут в начальный бандл!)
const ContactHubModal = dynamic(() => import('./ContactHubModal'), { ssr: false });
const TourQuizModal = dynamic(() => import('./TourQuizModal'), { ssr: false });

export default function GlobalModals() {
  const { 
    isContactOpen, closeContactModal, contactContext, contactInitialTab,
    isQuizOpen, closeQuizModal 
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
    </>
  );
}