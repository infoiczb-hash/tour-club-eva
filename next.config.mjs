import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Формируем надежный CSP заголовок
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src * blob: data:;
  connect-src *;
  font-src 'self' data:;
  frame-src 'self' https://www.youtube.com;
  object-src 'none';
  base-uri 'none';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    qualities: [75, 85],
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
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: cspHeader }, // 👈 ДОБАВЛЕН CSP
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);