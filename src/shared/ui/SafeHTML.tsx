// src/shared/ui/SafeHTML.tsx
import React from 'react';
import sanitizeHtml, { IOptions } from 'sanitize-html';

interface SafeHTMLProps {
  html: string;
  className?: string;
  // Позволяем расширять настройки очистки, если для конкретного места нужны другие теги
  options?: IOptions; 
}

// Базовые настройки безопасности для всего проекта
const defaultOptions: IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'img', 'span', 'iframe', 'br', 'p', 'ul', 'li', 'ol', 'strong', 'em', 'u', 'a', 'blockquote'
  ]),
  allowedAttributes: {
    '*': ['class', 'style'],
    'a': ['href', 'name', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
    'iframe': ['src', 'allowfullscreen', 'frameborder', 'width', 'height']
  },
  allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
  // Строго вырезаем все on* атрибуты (onclick, onerror и т.д.)
  nonTextTags: [ 'style', 'script', 'textarea', 'noscript' ],
};

export const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className, options }) => {
  if (!html) return null;

  // Очищаем HTML перед рендером
  const cleanHtml = sanitizeHtml(html, { ...defaultOptions, ...options });

  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: cleanHtml }} 
    />
  );
};