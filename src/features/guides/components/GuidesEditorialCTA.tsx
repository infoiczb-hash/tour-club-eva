// src/features/guides/components/GuidesEditorialCTA.tsx
"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useModalStore } from '@/shared/store/useModalStore';

export default function GuidesEditorialCTA() {
    const openContactModal = useModalStore((state) => state.openContactModal);

    return (
        <button
            onClick={() => openContactModal(undefined, 'HR')}
            className="w-full sm:w-auto px-10 py-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.5)] active:scale-95 flex items-center justify-center gap-3"
        >
            <span>Подать заявку</span>
            <ArrowRight size={20} />
        </button>
    );
}