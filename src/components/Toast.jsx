import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Небольшая задержка для запуска анимации
    const raf = requestAnimationFrame(() => setIsVisible(true));
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Ждем пока уедет обратно
    }, duration);

    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [duration, onClose]);

  const styles = {
    success: 'bg-teal-600 text-white shadow-teal-200',
    error: 'bg-red-500 text-white shadow-red-200',
    info: 'bg-blue-600 text-white shadow-blue-200'
  };

  const icons = {
    success: <CheckCircle size={24} />,
    error: <AlertCircle size={24} />,
    info: <Info size={24} />
  };

  return (
    <div 
        className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl transition-all duration-500 transform ${styles[type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="font-semibold text-sm pr-4">{message}</p>
      <button 
        onClick={() => setIsVisible(false)} 
        className="ml-auto p-1 hover:bg-white/20 rounded-full transition"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
