import { Metadata } from 'next';
import AboutClient from './AboutClient'; // ← клиентская часть

export const metadata: Metadata = {
  title: "О Турклубе «Эва» — Команда | Тирасполь",
  description: "Турклуб Эва — гиды с опытом 10+ лет. Активный отдых в Приднестровье. История, ценности, команда. Тирасполь.",
  keywords: [
    "турклуб Эва Тирасполь",
    "гиды Приднестровье",
    "организаторы туров Тирасполь",
  ],
};

export default function AboutPage() {
  return <AboutClient />;
}