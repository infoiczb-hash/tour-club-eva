import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    qualities: [55, 60, 75, 85],  // FIX: Добавили 55 и 60 в список допустимых quality
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 5184000,
    deviceSizes: [412, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 436],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', port: '' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '' },
      { protocol: 'https', hostname: 'res.cloudinary.com', port: '' },
      { protocol: 'https', hostname: 'img.youtube.com', port: '' },
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
        // FIX: Preload hint для hero-картинки /kids — браузер начнёт грузить её
        // ДО того как разберёт блокирующий CSS, что снизит LCP на ~300-500ms
        source: '/directions/kids',
        headers: [
          {
            key: 'Link',
            value: '<https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60,w_412/v1771662349/kids-bg_don8xd.webp>; rel=preload; as=image'
          }
        ],
      },
      {
        // FIX: То же для /local — preload hero-картинки
        source: '/directions/local',
        headers: [
          {
            key: 'Link',
            value: '<https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60,w_412/v1771665911/1_suclsq.jpg>; rel=preload; as=image'
          }
        ],
      },
      {
        // FIX: Preload hint для hero-картинки /kayaking
        source: '/directions/kayaking',
        headers: [
          {
            key: 'Link',
            value: '<https://res.cloudinary.com/dwrei7k2z/image/upload/f_auto,q_60,w_412/v1771584228/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2025-06-21_11-50-14-080_a7uba5.jpg>; rel=preload; as=image'
          }
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // УДАЛЕНО: Content-Security-Policy (теперь в middleware)
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);