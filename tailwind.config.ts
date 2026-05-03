import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // ✅ container — на уровне theme (не extend!), чтобы полностью переопределить дефолт
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',    // px-4 на мобиле
        sm: '1.5rem',       // px-6 на планшете
        lg: '2rem',         // px-8 на десктопе
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1280px',    // max-width фиксирован на 1280px — единый для всего сайта
      },
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // 🚀 СЕМАНТИЧЕСКИЕ ЦВЕТА ИНТЕРФЕЙСА
        ui: {
          bg: 'var(--ui-bg)',         // -> bg-ui-bg
          panel: 'var(--ui-panel)',   // -> bg-ui-panel
          border: 'var(--ui-border)', // -> border-ui-border
          text: 'var(--ui-text)',     // -> text-ui-text
          muted: 'var(--ui-muted)',   // -> text-ui-muted
          accent: 'var(--ui-accent)', // -> text-ui-accent / bg-ui-accent
          danger: 'var(--ui-danger)', // -> text-ui-danger
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-montserrat)'],
      },
      keyframes: {
        'hero-title': {
          '0%':   { transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'hero-title': 'hero-title 0.8s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
      }
    }
  },
  plugins: [
    // tailwindcss-animate убран — классы animate-in, fade-in, slide-in-from-*,
    // zoom-in-*, fill-mode-both воспроизведены в globals.css (@keyframes enter).
    // Поведение идентично, файлы компонентов не тронуты.
    require("@tailwindcss/typography"),
  ],
};

export default config;