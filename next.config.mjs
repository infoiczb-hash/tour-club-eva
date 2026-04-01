import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // ── СТРАТЕГИЯ FREE TIER: Кастомный лоадер берет всё на себя ──
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    
    // Поддерживаемые форматы (используются браузером через Accept)
    formats: ['image/avif', 'image/webp'],
    
    // ЭКОНОМИЯ КРЕДИТОВ: Строго ограничиваем количество генерируемых ширин в srcset.
    // Чем меньше цифр в этих массивах, тем меньше уникальных трансформаций создает Cloudinary.
    deviceSizes: [640, 1080, 1920], // Оставили только 3 главных брейкпоинта (мобилка, планшет, десктоп)
    imageSizes: [64, 128, 256, 384], // Убрали микро-размеры (16, 32), браузер отлично ужмет 64px
    

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
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);