"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

export default function DirectionB2BButton() {
  const openContactModal = useModalStore((state) => state.openContactModal);

  return (
    <div className="mt-5 pointer-events-auto relative z-30">
      <button 
        onClick={(e) => {
          e.preventDefault(); 
          e.stopPropagation();
          openContactModal('Заявка на сотрудничество (от организатора)', 'B2B');
        }}
        className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95 w-full sm:w-auto justify-center"
      >
        Оставить заявку <ArrowRight size={16} className="ml-1" />
      </button>
    </div>
  );
}