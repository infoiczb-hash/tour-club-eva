import { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: "Политика конфиденциальности | Турклуб «Эва»",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}