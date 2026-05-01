import { BASE_URL } from '@/lib/constants';

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
return (
    <script
      type="application/ld+json"
      // ✅ ИСПРАВЛЕНО: Добавлен .replace для безопасности
      dangerouslySetInnerHTML={{ 
        __html: JSON.stringify(schema).replace(/</g, '\\u003c') 
      }}
    />
  );
}