import Link from "next/link";
import { Compass, Map, Home, MountainSnow } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-6">
      
      {/* --- AMBIENT BACKGROUND --- */}
      {/* Туман и свечение, как на главной */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-900/20 blur-[150px] rounded-full opacity-40" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/20 blur-[150px] rounded-full opacity-40" />
        {/* Текстура шума (опционально) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        
        {/* --- ICON / ILLUSTRATION --- */}
        <div className="mb-8 relative inline-block">
            {/* Анимированный круг за иконкой */}
            <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative w-32 h-32 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <Compass size={64} className="text-teal-500 animate-[spin_10s_linear_infinite]" strokeWidth={1.5} />
            </div>
            
            {/* Плашка 404 */}
            <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-slate-800 text-white font-black text-xl px-4 py-1 rounded-xl rotate-[-6deg] shadow-lg">
                404
            </div>
        </div>

        {/* --- TEXT CONTENT --- */}
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">
          Мы сбились с <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">тропы</span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
          Кажется, этой страницы не существует или она была перемещена ветром. 
          Здесь красиво, но одиноко. Давайте вернем вас к цивилизации.
        </p>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/" 
            className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20 group"
          >
            <Home size={18} />
            Вернуться в лагерь
          </Link>
          
          <Link 
            href="/#tour" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group"
          >
            <Map size={18} className="group-hover:text-teal-400 transition-colors"/>
            Найти новый маршрут
          </Link>
        </div>

        {/* --- FOOTER DECORATION --- */}
        <div className="mt-16 pt-8 border-t border-white/5 flex justify-center gap-5 opacity-50">
            <MountainSnow size={24} className="text-slate-700" />
            <MountainSnow size={32} className="text-slate-600 -mt-2" />
            <MountainSnow size={24} className="text-slate-700" />
        </div>

      </div>
    </div>
  );
}