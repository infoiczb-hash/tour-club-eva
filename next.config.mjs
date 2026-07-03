import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['lucide-react', 'react-markdown', 'date-fns'],
    serverActions: {
      bodySizeLimit: '10mb',
    },    
  },

  images: {
    // ── СТРАТЕГИЯ FREE TIER: Кастомный лоадер берет всё на себя ──
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    
    // Поддерживаемые форматы (используются браузером через Accept)
    formats: ['image/avif', 'image/webp'],
    
    // ЭКОНОМИЯ КРЕДИТОВ: Строго ограничиваем количество генерируемых ширин в srcset.
    // Чем меньше цифр в этих массивах, тем меньше уникальных трансформаций создает Cloudinary.
    // ✅ ИСПРАВЛЕНО: Добавлены промежуточные размеры для точного попадания в сетку блога и туров
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    
    // РАЗРЕШЕННЫЕ ДОМЕНЫ (Обязательно, чтобы Next.js не блокировал рендер <Image>)
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' }, // ⚠️ Оставляем, пока в БД есть их ссылки!
    ],
  },

  compress: true,

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // ВНЕДРЕНО: Не ломает Telegram OAuth
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // УБРАНО: Заголовок Content-Security-Policy. 
          // Теперь он генерируется исключительно в middleware.ts с поддержкой nonce и 'unsafe-eval'.
        ],
      },
    ];
  },
};

// Экспортируем конфигурацию: сначала применяем bundleAnalyzer, затем Sentry
export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    silent: true,
    org: "tc-eva",
    project: "javascript-nextjs",
  },
  {
    widenClientFileUpload: true,
    // transpileClientSDK УБРАН (deprecated)
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);