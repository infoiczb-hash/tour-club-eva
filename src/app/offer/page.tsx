import { Metadata } from 'next';
import OfferClient from './OfferClient';

export const metadata: Metadata = {
  title: "Договор оферты | Турклуб «Эва»",
  robots: { index: false, follow: false },
};

export default function OfferPage() {
  return <OfferClient />;
}