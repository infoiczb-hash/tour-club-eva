"use client";

import { useState } from "react";
import { X, Info, CheckCircle2 } from "lucide-react";

type LevelInfo = {
  name: string;
  toursRequired: string;
  benefits: string[];
  colorMode: string;
};

const LEVELS_DATA: LevelInfo[] = [
  { name: "Первопроходец", toursRequired: "0 - 2 тура", benefits: ["Доступ к личному кабинету"], colorMode: "from-emerald-700 to-teal-900" },
  { name: "Искатель", toursRequired: "3 - 5 туров", benefits: ["Участиев реферальной программ"], colorMode: "from-blue-600 to-indigo-900" },
  { name: "Следопыт", toursRequired: "6 - 10 туров", benefits: ["Бесплатная аренда снаряжения (1 ед.) для горных утров", "Ранний доступ к новым маршрутам","Возможность участвовать в закрытых/тестовых маршрутах"], colorMode: "from-purple-600 to-violet-900" },
  { name: "Мастер троп", toursRequired: "11 - 20 туров", benefits: ["Возможность выбрать место в группе раньше (в автобусе / палатке)"], colorMode: "from-orange-500 to-red-700" },
  { name: "Легенда", toursRequired: "21+ туров", benefits: ["Бесплатное участие в 1 туре однодневном туре раз в год", "Эксклюзивный значок", "быть помощником гида” в турах"], colorMode: "from-slate-800 to-black border-yellow-500/50" }
];

export default function LevelsInfoModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-4 flex items-center justify-center w-full gap-2 py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-white/5 text-sm font-medium text-slate-300 hover:text-white"
      >
        <Info size={16} />
        <span>Система уровней и привилегии</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">Уровни лояльности</h2>
            
            <div className="space-y-4">
              {LEVELS_DATA.map((level, index) => (
                <div key={index} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${level.colorMode}`} />
                      <h3 className="font-bold text-white text-lg">{level.name}</h3>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-950 text-slate-300">
                      {level.toursRequired}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {level.benefits.map((benefit, bIndex) => (
                      <li key={bIndex} className="flex items-start gap-2 text-sm text-slate-400">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}