/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ─────────────────────────────────────────────────────────────
  // 🖼️  ИЗОБРАЖЕНИЯ + CLOUDINARY LOADER
  // loaderFile: автоматически добавляет f_auto,q_60,w_{width}
  // ко всем картинкам Cloudinary через next/image.
  // Файл: src/lib/cloudinary-loader.ts
  // Картинки НЕ из Cloudinary (Supabase, Unsplash) — без изменений.
  // ─────────────────────────────────────────────────────────────
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',

    // AVIF весит на 30-50% меньше WebP — loader передаёт f_auto,
    // Cloudinary сам выбирает лучший формат для браузера
    formats: ['image/avif', 'image/webp'],

    // Кэш оптимизированных картинок на Vercel: 60 дней
    minimumCacheTTL: 5184000,

    // FIX: промежуточные размеры — решает проблему 640px на 436px экране
    deviceSizes: [412, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 436],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🗜️  GZIP / BROTLI СЖАТИЕ
  // ─────────────────────────────────────────────────────────────
  compress: true,

  // ─────────────────────────────────────────────────────────────
  // 🔒  SECURITY & CACHING HEADERS
  // ─────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Статические ассеты Next.js — кэш 1 год
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers для всех страниц
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

};

export default nextConfig;
