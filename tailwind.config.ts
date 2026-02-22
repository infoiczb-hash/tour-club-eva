import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Только Inter
        sans: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        // Типографика по гайду
        xs: ["12px", { lineHeight: "1" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["18px", { lineHeight: "1.6" }],
        xl: ["20px", { lineHeight: "1.5" }],
        "2xl": ["24px", { lineHeight: "1.25" }],
        "3xl": ["32px", { lineHeight: "1.25" }],
        "4xl": ["40px", { lineHeight: "1.1" }],
        "5xl": ["48px", { lineHeight: "1.1" }],
        "6xl": ["64px", { lineHeight: "1.1" }],
        
        // Специальные размеры
        'hero': ['clamp(40px, 8vw, 88px)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '900' }],
        'h1': ['clamp(36px, 6vw, 72px)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'h2': ['clamp(32px, 5vw, 64px)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      colors: {
        // ✅ TEAL (Основной бренд)
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf", // Светлый акцент
          500: "#14b8a6", // BRAND MAIN
          600: "#0d9488", // Hover
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        // ✅ SLATE (Глубокие серые для Clean Tech)
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569", // Основной текст
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a", // Темный фон / Заголовки
          950: "#020617", // Super Dark фон
        },
        // Алиасы для обратной совместимости
        primary: {
          DEFAULT: "#14b8a6", // teal-500
          hover: "#0d9488",   // teal-600
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '3xl': "24px",
      },
      transitionDuration: {
        '1500': '1500ms', 
        '2000': '2000ms',
      },
      backgroundImage: {
        "hero-overlay": "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)",
        "card-overlay": "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
        "grad-gifts": "linear-gradient(135deg, #ec4899 0%, #dc2626 100%)",
        "grad-trekking": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "grad-moldova": "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
        "grad-kids": "linear-gradient(135deg, #f97316 0%, #eab308 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }, 
        },
        "marquee-reverse": {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 40s linear infinite",
      },
    },
  },
  // ✅ ВОТ ТУТ МЫ ОБЪЕДИНИЛИ ПЛАГИНЫ
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"), // Добавил плагин сюда
  ],
};
export default config;