'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function FloatingContactBtn() {
  const { scrollY } = useScroll();
  const [showFab, setShowFab] = useState(false);

  // Логика появления после 800px скролла
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setShowFab(latest > 800);
    });
  }, [scrollY]);

  return (
    <AnimatePresence>
      {showFab && (
        <motion.a
          href="https://t.me/your_manager" // Замени на свой реальный линк
          target="_blank"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-8 right-6 z-50 flex items-center gap-3 group"
        >
           {/* Текстовая подсказка (видна только на десктопе при наведении/появлении) */}
           <span className="hidden md:block bg-slate-900/90 text-teal-400 text-xs font-bold py-2 px-4 rounded-xl border border-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity absolute right-16 whitespace-nowrap shadow-xl backdrop-blur-sm">
              Есть вопрос по SUP?
           </span>
           
           {/* Сама кнопка */}
           <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)] border border-white/20 relative">
              <MessageCircle size={28} className="text-white" />
              
              {/* Пульсирующая красная точка (индикатор уведомления) */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
           </div>
        </motion.a>
      )}
    </AnimatePresence>
  );
}