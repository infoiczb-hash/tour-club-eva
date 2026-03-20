"use client";

import { ArrowRight } from 'lucide-react';
import { useModalStore } from '@/shared/store/useModalStore';

export default function OrgHeroButton() {
  const openContactModal = useModalStore((state) => state.openContactModal);

  return (
    <button
      onClick={() => openContactModal('Организация мероприятия / Корпоратив', 'TOUR')}
      className="group w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3"
    >
      <span>Обсудить задачу</span>
      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
    </button>
  );
}