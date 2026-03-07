// src/features/guides/components/GuideContactButton.tsx
"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

interface Props {
  guideName: string;
}

export default function GuideContactButton({ guideName }: Props) {
  const openContactModal = useModalStore((state) => state.openContactModal);

  return (
    <button 
      onClick={() => openContactModal(`Хочу в тур с гидом: ${guideName}`, 'TOUR')}
      className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-[0.98]"
    >
      <MessageCircle size={18} />
      Хочу в тур с ним
    </button>
  );
}