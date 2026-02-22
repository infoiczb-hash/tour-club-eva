'use client';

import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function OrgHero({ onScrollDown }: { onScrollDown?: () => void }) {
  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
     
      <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl mt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* B2B Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-full mb-8">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-[0.15em] text-indigo-300 uppercase">
              Для HR, руководителей и мастеров
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
            МЫ СОЗДАЕМ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">СОБЫТИЯ</span>,<br />
            КОТОРЫЕ МЕНЯЮТ КОМАНДЫ
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Организация корпоративов, тимбилдингов и ретритов на природе под ключ. От 10 до 100+ человек. Забираем на себя всю логистику, кухню и безопасность.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button 
                onClick={onScrollDown}
                className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3"
             >
                <span>Обсудить задачу</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}