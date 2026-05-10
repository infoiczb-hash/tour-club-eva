import React from 'react';

export default function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        {/* Заглушка логотипа */}
        <div className="w-32 h-8 bg-white/5 rounded-lg animate-pulse" />
        
        {/* Заглушка навигации для десктопа */}
        <div className="hidden md:flex space-x-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-4 bg-white/5 rounded animate-pulse" />
          ))}
        </div>

        {/* Заглушка кнопки входа */}
        <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
      </div>
    </header>
  );
}