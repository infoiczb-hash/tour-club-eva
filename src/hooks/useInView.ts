import { useEffect, useRef, useState } from 'react';

/**
 * useInView — нативная замена Framer Motion whileInView.
 *
 * Использование:
 *   const { ref, inView } = useInView();
 *
 *   <div
 *     ref={ref}
 *     className={cn(
 *       'transition-all duration-500 ease-out',
 *       inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
 *     )}
 *   />
 *
 * options читаются один раз при mount — передавай статичный объект или
 * мемоизируй через useMemo если нужна реактивность.
 *
 * Generic T позволяет использовать на любом HTML-элементе:
 *   const { ref, inView } = useInView();              // HTMLDivElement по умолчанию
 *   const { ref, inView } = useInView<HTMLElement>();  // section, article и т.д.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // аналог viewport={{ once: true }}
        }
      },
      { rootMargin: '-50px', threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // options читается один раз — intentional

  return { ref, inView };
}