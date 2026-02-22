/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 👇 ЭТА СТРОКА ИСПРАВЛЯЕТ ОШИБКУ "quality 90"
    qualities: [75, 80, 90, 95], 

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Разрешаем все поддомены Supabase
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Для демо-картинок
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Разрешаем наше хранилище Cloudinary
        port: '',
      },
      // 👇 ДОБАВИЛИ YOUTUBE ДЛЯ ОБЛОЖЕК ВИДЕО 👇
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;