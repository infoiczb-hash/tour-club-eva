// src/lib/cloudinary-loader.test.ts
import { describe, it, expect } from '@jest/globals';
import cloudinaryLoader from './cloudinary-loader';

describe('cloudinaryLoader', () => {
  
  describe('Supabase Storage', () => {
    it('добавляет параметры трансформации для публичных объектов Supabase', () => {
      const url = 'https://xxx.supabase.co/storage/v1/object/public/tours/photo.jpg';
      const result = cloudinaryLoader({ src: url, width: 800, quality: 80 });
      
      expect(result).toContain('/storage/v1/render/image/public/');
      expect(result).toContain('width=800');
      expect(result).toContain('quality=80');
      expect(result).toContain('resize=cover');
    });

    it('использует дефолтное качество (75), если quality не передано', () => {
      const url = 'https://xxx.supabase.co/storage/v1/object/public/tours/photo.jpg';
      const result = cloudinaryLoader({ src: url, width: 800 });
      
      expect(result).toContain('quality=75');
    });
  });

  describe('Cloudinary Upload', () => {
    it('добавляет легкие трансформации и запрашиваемую ширину', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
      const result = cloudinaryLoader({ src: url, width: 600, quality: 90 });
      
      // Должен вставить трансформацию сразу после /upload/
      expect(result).toContain('/upload/f_auto,q_auto:eco,w_600/v123/sample.jpg');
    });

    it('ограничивает ширину хард-лимитом 1200px (защита bandwidth)', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/v123/sample.jpg';
      const result = cloudinaryLoader({ src: url, width: 3840, quality: 90 });
      
      // Несмотря на то, что Next.js запросил 3840, лоадер должен отдать w_1200
      expect(result).toContain('w_1200');
      expect(result).not.toContain('w_3840');
    });
  });

  describe('Внешние URL и локальные файлы', () => {
    it('не трогает внешние URL (Unsplash, Google), чтобы не тратить кредиты', () => {
      const url = 'https://images.unsplash.com/photo-12345';
      const result = cloudinaryLoader({ src: url, width: 800 });
      
      expect(result).toBe(url);
    });

    it('не трогает локальные или относительные пути', () => {
      const url = '/images/local-photo.jpg';
      const result = cloudinaryLoader({ src: url, width: 500 });
      
      expect(result).toBe(url);
    });

    it('обрабатывает blob ссылки без изменений', () => {
      const url = 'blob:http://localhost:3000/1234-5678';
      const result = cloudinaryLoader({ src: url, width: 500 });
      
      expect(result).toBe(url);
    });
  });

});