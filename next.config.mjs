import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Проверяем, в каком окружении мы находимся
const isDev = process.env.NODE_ENV !== 'production';

// Формируем строгий, но рабочий CSP
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://telegram.org ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://telegram.org;
  img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://telegram.org https://img.youtube.com https://images.unsplash.com;
  font-src 'self';
  frame-src 'self' https://t.me https://oauth.telegram.org https://telegram.org https://www.youtube.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim(); // Убираем лишние пробелы и переносы для чистоты заголовка

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['lucide-react', 'react-markdown', 'date-fns'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
    browsersListForSwc: true, // ВНЕДРЕНО: Убирает лишние полифилы
  },

  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    formats: ['image/avif', 'image/webp'],
    // ✅ ИСПРАВЛЕНО: Добавлены промежуточные размеры для точного попадания в сетку блога и туров
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
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
          { key: 'Content-Security-Policy', value: cspHeader }, // ВНЕДРЕНО: Безопасный CSP
        ],
      },
    ];
  },
};

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