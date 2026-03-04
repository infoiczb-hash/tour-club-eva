import { Metadata } from 'next';
import FaqClient from './FaqClient';

export const metadata: Metadata = {
  title: "Частые Вопросы о Турах | Турклуб «Эва»",
  description: "Ответы на вопросы о сплавах, походах и детских программах. Снаряжение, безопасность, возраст, трансфер, оплата, отмена. Тирасполь.",
  keywords: [
    "вопросы о сплаве байдарки",
    "FAQ туры Приднестровье",
    "безопасность сплав Днестр",
    "что взять в поход",
  ],
};

export default function FAQPage() {
  return <FaqClient />;
}