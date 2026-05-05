import { Metadata } from "next";
import SafetyRegulations from "@/features/directions/kayaking/SafetyRegulations";

export const metadata: Metadata = {
  title: "Техника безопасности на сплавах — Турклуб ЭВА",
  description: "Полный свод правил безопасности на воде: инструктаж, требования к экипировке и нормы поведения во время сплавов на байдарках и каяках. Обязательно к прочтению.",
  openGraph: {
    title: "Техника безопасности на сплавах — Турклуб ЭВА",
    description: "Всё, что нужно знать перед тем, как сесть в лодку: правила, снаряжение и важные запреты.",
    type: "website",
    url: "https://evatur.club/rules-kayaking",
    images: [
      {
        url: "https://evatur.club/og-default.jpg", // Убедитесь, что путь к OG-изображению верный
        width: 1200,
        height: 630,
        alt: "Турклуб ЭВА — Техника безопасности",
      },
    ],
  },
  alternates: {
    canonical: "/rules-kayaking",
  },
};

export default function RulesKayakingPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок страницы с анимацией */}
        <header className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
            Техника <span className="text-teal-500">Безопасности</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium text-sm md:text-lg leading-relaxed">
            Пожалуйста, изучите эти правила максимально внимательно. Знание техники безопасности 
            делает ваш отдых предсказуемым, спокойным и по-настоящему приятным.
          </p>
        </header>

        {/* Основной компонент с подробными правилами (SafetyRegulations) */}
        <section className="animate-in fade-in zoom-in-95 duration-1000 delay-200">
          <SafetyRegulations />
        </section>

        {/* Финальное предупреждение */}
        <footer className="mt-16 text-center border-t border-white/5 pt-8">
          <p className="text-slate-500 text-sm italic">
            Инструктор-проводник оставляет за собой право отстранить участника от сплава при 
            грубом нарушении данных правил безопасности без возврата стоимости тура.
          </p>
        </footer>
      </div>
    </main>
  );
}