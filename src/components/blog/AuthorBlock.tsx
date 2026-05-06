// src/components/blog/AuthorBlock.tsx
import Image from 'next/image';
import Link from 'next/link';

interface AuthorBlockProps {
  name: string;
  role?: string;
  image?: string | null;
  guideSlug?: string | null;
  centered?: boolean;     // true = большой по центру, false = компактный слева
  className?: string;
}

export default function AuthorBlock({
  name,
  role = "Гид клуба",
  image,
  guideSlug,
  centered = true,
  className = ""
}: AuthorBlockProps) {
  const content = (
    <>
      <div className={`author-circle ${centered ? '' : 'shrink-0'}`}>
        {image ? (
          <Image 
             src={image} 
             alt={name} 
             fill 
             sizes={centered ? "64px" : "44px"} 
             className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            👤
          </div>
        )}
      </div>
      <div className={`author-info ${centered ? '' : 'ml-0'}`}>
        <span className="author-name">{name}</span>
        <span className="author-role">{role}</span>
      </div>
    </>
  );

  if (guideSlug) {
    return (
      <Link href={`/guides/${guideSlug}`} className={`block ${className}`}>
        {centered ? (
          <div className="flex flex-col items-center">{content}</div>
        ) : (
          <div className="author-compact">{content}</div>
        )}
      </Link>
    );
  }

  return centered ? (
    <div className={`flex flex-col items-center ${className}`}>{content}</div>
  ) : (
    <div className={`author-compact ${className}`}>{content}</div>
  );
}