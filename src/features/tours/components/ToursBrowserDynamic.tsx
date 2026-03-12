"use client";

import dynamic from 'next/dynamic';

const ToursBrowserDynamic = dynamic(() => import('./ToursBrowser'));

export default ToursBrowserDynamic;