"use client";

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

interface Props {
  context?: string;
  tab?: 'TOUR' | 'HR' | 'BLOG' | 'B2B' | 'REVIEW' | 'HELP';
}

export default function AskQuestionButton({ context = 'Общий вопрос с сайта', tab = 'TOUR' }: Props) {
  const openContactModal = useModalStore((state) => state.openContactModal);

  return (
    <button 
        onClick={() => openContactModal(context, tab)}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-3.5 md:py-3 rounded-xl font-bold uppercase text-xs md:text-sm tracking-widest transition-all shadow-lg shadow-teal-900/20 active:scale-95 shrink-0"
    >
        <HelpCircle size={18}/> Задать вопрос
    </button>
  );
}