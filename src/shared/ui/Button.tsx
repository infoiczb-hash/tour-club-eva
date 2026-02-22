import React from 'react';
import { Loader } from 'lucide-react';

// 1. Описываем, какие пропсы принимает кнопка
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ 
    children, 
    isLoading = false, 
    variant = 'primary', 
    className = '', 
    disabled, 
    ...props 
}) => {
    
    // ✅ Базовые стили: 
    // - active:scale-95 (эффект нажатия "пружинка")
    // - disabled:active:scale-100 (отключенная кнопка не пружинит)
    const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const variants = {
        // Primary: Добавили hover:shadow-xl для эффекта левитации
        primary: "bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5",
        
        // Secondary: Добавили цвет рамки при наведении
        secondary: "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-100 shadow-sm hover:border-teal-500/30",
        
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        outline: "border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur"
    };

    return (
        <button 
            disabled={isLoading || disabled} 
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {/* Логика: если грузится, показываем спиннер по центру */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader size={20} className="animate-spin" />
                </div>
            )}
            
            {/* Логика: если грузится, текст становится прозрачным (сохраняя ширину кнопки) */}
            <span className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {children}
            </span>
        </button>
    );
};

export default Button;