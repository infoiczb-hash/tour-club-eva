import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ─────────────────────────────────────────────────────────────
  // 🚀  ОПТИМИЗАЦИЯ ПАКЕТОВ (tree-shaking)
  // Next.js импортирует только используемые части пакетов
  // ─────────────────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@supabase/supabase-js',
      'gsap',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🖼️  ИЗОБРАЖЕНИЯ + CLOUDINARY LOADER
  // ─────────────────────────────────────────────────────────────
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
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

  // ─────────────────────────────────────────────────────────────
  // 🗜️  СЖАТИЕ
  // ─────────────────────────────────────────────────────────────
  compress: true,

  // ─────────────────────────────────────────────────────────────
  // 🔒  SECURITY & CACHING HEADERS
  // ─────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
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
