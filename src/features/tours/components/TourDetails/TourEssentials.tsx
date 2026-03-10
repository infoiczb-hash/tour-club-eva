"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download, 
  Backpack, 
  Wallet, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

interface TourEssentialsProps {
  included: string[];
  additionalExpenses: string[];
  documents?: any[];
  checklist?: string | null;
}

export default function TourEssentials({ 
  included, 
  additionalExpenses, 
  documents = [], 
  checklist 
}: TourEssentialsProps) {
  
  // Состояния для аккордеонов. "Включено" открыто с самого начала для акцента на ценности.
  const [includedOpen, setIncludedOpen] = useState(true);
  const [excludedOpen, setExcludedOpen] = useState(false);

  return (
    <section className="scroll-mt-24" id="essentials">
      
      {/* Заголовок секции */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 border border-teal-500/20">
           <Wallet size={20} />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
           Условия и подготовка
        </h2>
      </div>

      {/* Аккордеоны расходов */}
      <div className="grid md:grid-cols-2 gap-4 mb-8 items-start">
        
        {/* Аккордеон: Что включено */}
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
          includedOpen 
            ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
            : 'bg-slate-900/40 border-white/5 hover:border-emerald-500/20'
        }`}>
           <button 
             onClick={() => setIncludedOpen(!includedOpen)}
             className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
           >
              <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2">
                <CheckCircle size={16} /> 
                Что включено
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px]">
                  {included?.length || 0}
                </span>
              </h3>
              <ChevronDown 
                size={18} 
                className={`text-emerald-500/50 transition-transform duration-300 ${
                  includedOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-emerald-400'
                }`} 
              />
           </button>
           
           <AnimatePresence>
             {includedOpen && included && included.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="px-5 pb-5 space-y-3">
                    {included.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Аккордеон: Дополнительные расходы */}
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
          excludedOpen 
            ? 'bg-rose-500/5 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]' 
            : 'bg-slate-900/40 border-white/5 hover:border-rose-500/20'
        }`}>
           <button 
             onClick={() => setExcludedOpen(!excludedOpen)}
             className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
           >
              <h3 className="text-rose-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2">
                <XCircle size={16} /> 
                Дополнительно
                <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px]">
                  {additionalExpenses?.length || 0}
                </span>
              </h3>
              <ChevronDown 
                size={18} 
                className={`text-rose-500/50 transition-transform duration-300 ${
                  excludedOpen ? 'rotate-180 text-rose-400' : 'group-hover:text-rose-400'
                }`} 
              />
           </button>
           
           <AnimatePresence>
             {excludedOpen && additionalExpenses && additionalExpenses.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="px-5 pb-5 space-y-3">
                    {additionalExpenses.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Блок со снаряжением и документами */}
      <div className="grid md:grid-cols-2 gap-4">
        
        {/* Чек-лист снаряжения */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-teal-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2 mb-4">
              <Backpack size={16} /> Снаряжение
            </h3>
            {checklist ? (
              <div 
                className="text-slate-300 text-sm prose prose-invert prose-p:leading-relaxed max-w-none" 
               dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(checklist || 'Список вещей уточняется...') }}
              />
            ) : (
              <p className="text-slate-500 text-sm italic">
                Специальное снаряжение не требуется. Достаточно удобной одежды по погоде.
              </p>
            )}
        </div>

        {/* Документы */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-teal-400 font-black uppercase tracking-widest text-[13px] flex items-center gap-2 mb-4">
              <ShieldCheck size={16} /> Документы
            </h3>
            
            {documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc: any, i: number) => (
                  <Link 
                    key={i} 
                    href={doc.url || '#'} 
                    target="_blank"
                    className="group flex items-center justify-between p-3 bg-white/5 hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Файл</span>
                        <span className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                          {doc.title || `Документ ${i + 1}`}
                        </span>
                      </div>
                    </div>
                    <Download size={16} className="text-slate-600 group-hover:text-teal-500 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">
                Для этого тура специальные документы не требуются. 
              </p>
            )}
        </div>
        
      </div>
    </section>
  );
}