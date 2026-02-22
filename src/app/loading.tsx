import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Эмоциональный лоадер в стиле ЭВА */}
      <div className="text-center z-10">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl mx-auto mb-6 animate-pulse">
           <Sparkles size={32} className="text-teal-400 animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-condensed font-bold text-white uppercase tracking-widest mb-2">
          Собираем рюкзак...
        </h2>
        <p className="text-slate-400 text-sm">
          Загружаем лучшие маршруты для тебя
        </p>
      </div>
      
      {/* Фоновый шум */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-900 to-slate-800 opacity-50" />
    </div>
  );
}