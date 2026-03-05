"use client";

import dynamic from 'next/dynamic';

// Вызываем ssr: false внутри "use client" компонента
const ToursBrowserDynamic = dynamic(() => import('./ToursBrowser'), {
  ssr: false,
});

export default ToursBrowserDynamic;