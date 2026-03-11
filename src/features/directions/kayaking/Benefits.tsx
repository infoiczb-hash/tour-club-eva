// src/features/directions/kayaking/Benefits.tsx
import { 
  Users, CheckCircle2, Waves, Heart, 
  LifeBuoy, Zap, Sparkles, 
  Megaphone, Anchor, BriefcaseMedical,
  ChevronRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const mainBenefits = [
  { id: 1, title: "Сплавы по Днестру с ТК «Эва»", desc: "Это не только физическая активность, но и идеальный способ провести время с семьёй или друзьями на природе, наслаждаясь её красотами.", icon: Waves, tag: "Турклуб Эва", desktopClass: "md:col-span-2 lg:col-span-6 bg-gradient-to-br from-teal-900/40 to-slate-900 border-teal-500/30", isCompactOnMobile: false },
  { id: 2, title: "Всё продумано до мелочей", desc: "Комфорт в деталях — от посадки до хранения ваших вещей в лодке.", icon: CheckCircle2, features: ["Продуманная логистика", "Удобные мягкие сидушки", "Места для багажа", "Гермомешки для гаджетов"], desktopClass: "md:col-span-2 lg:col-span-6", isCompactOnMobile: false },
  { id: 3, title: "Можно с детьми", desc: "Спокойные воды и надежные байдарки делают сплав доступным для самых маленьких. От двух лет", icon: Users, desktopClass: "md:col-span-1 lg:col-span-3", isCompactOnMobile: true },
  { id: 4, title: "Никогда не гребли?", desc: "60 % наших гостей — новички. Обучим азам за 15 минут до старта.", icon: Zap, desktopClass: "md:col-span-1 lg:col-span-3 border-orange-500/20 bg-orange-500/5", isCompactOnMobile: true },
  { id: 5, title: "Нужна перезагрузка?", desc: "Тишина реки и мерный плеск весла — лучший детокс от суеты.", icon: Heart, desktopClass: "md:col-span-1 lg:col-span-3 border-pink-500/20 bg-pink-500/5", isCompactOnMobile: true },
  { id: 6, title: "Не умеете плавать?", desc: "Наши жилеты держат надежно. Безопасность — приоритет №1.", icon: LifeBuoy, desktopClass: "md:col-span-1 lg:col-span-3", isCompactOnMobile: true },
];

const instructorRoles = [
  { title: "Детальный инструктаж", desc: "Перед выходом на воду ставим правильную технику гребли и объясняем правила поведения. Никаких «разберетесь по ходу».", icon: Megaphone },
  { title: "Помощь на воде", desc: "Гид всегда рядом. Покажет лучшую траекторию, поможет причалить, а если силы покинут — возьмет на буксир.", icon: Anchor },
  { title: "Безопасность и аптечка", desc: "У инструктора всегда под рукой стандартная групповая аптечка первой помощи и ремкомплект для непредвиденных ситуаций.", icon: BriefcaseMedical },
];

export default function Benefits() {
  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans">
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-teal-500/10 md:blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 md:blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* HEADER */}
        <div className="max-w-3xl mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/30 backdrop-blur-md mb-4 md:mb-6">
            <Sparkles size={14} className="text-teal-400" />
            <span className="text-[14px] font-bold uppercase tracking-widest text-teal-400">Почему мы</span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-[0.9]">
            Идеальный отдых <br className="hidden md:block" />
            <span className="text-teal-500">на воде</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl">
            Мы берем на себя всю рутину, логистику и безопасность. Вам остается только грести, загорать и наслаждаться видами.
          </p>
        </div>

        {/* Bento Grid Desktop */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-[minmax(200px,auto)] mb-20">
          {mainBenefits.map((item, idx) => (
            <BenefitCard key={item.id} item={item} idx={idx} isDesktop />
          ))}
        </div>

        {/* Mobile */}
        <div className="flex flex-col md:hidden gap-4 mb-16 relative">
          <BenefitCard item={mainBenefits[0]} idx={0} />
          <BenefitCard item={mainBenefits[1]} idx={1} />
          <div className="relative mt-2">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {mainBenefits.slice(2, 6).map((item, idx) => (
                <BenefitCard key={item.id} item={item} idx={idx + 2} isSwipeable />
              ))}
            </div>
            <div className="absolute bottom-0 right-4 flex items-center gap-1 animate-pulse pointer-events-none">
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
              <ChevronRight size={14} className="text-teal-400" />
            </div>
          </div>
        </div>

        {/* INSTRUCTOR SECTION */}
        <div className="pt-12 md:pt-16 border-t border-white/10 animate-in fade-in duration-700">
          <div className="text-left mb-10">
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
              Надежный тыл: <br className="md:hidden" /><span className="text-amber-500">Профи на борту</span>
            </h3>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl">
              Ваш поход сопровождает инструктор. Он берет на себя все технические вопросы, чтобы вы могли просто расслабиться.
            </p>
          </div>

          <div className="relative">
            <div className="flex flex-row md:grid md:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-6 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {instructorRoles.map((role, idx) => {
                const Icon = role.icon;
                return (
                  <div
                    key={idx}
                    className="w-[85vw] md:w-auto flex-shrink-0 snap-center bg-slate-900/60 border border-white/5 rounded-[2rem] p-5 md:p-8 hover:border-amber-500/30 transition-all duration-300 group flex flex-row items-center md:flex-col md:items-start text-left animate-in slide-in-from-bottom-8 fill-mode-both"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mr-4 md:mr-0 md:mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all duration-500">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] sm:text-base md:text-xl font-black text-white uppercase tracking-tight mb-1 md:mb-3 group-hover:text-amber-400 transition-colors leading-tight">
                        {role.title}
                      </h3>
                      <p className="text-[14px] md:text-sm text-slate-400 font-medium leading-relaxed line-clamp-3 md:line-clamp-none">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="md:hidden absolute bottom-0 right-4 flex items-center gap-1 animate-pulse pointer-events-none">
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">Мотай</span>
              <ChevronRight size={14} className="text-teal-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitCard({ item, idx, isDesktop = false, isSwipeable = false }: any) {
  const Icon = item.icon;

  if (!isDesktop && item.isCompactOnMobile) {
    return (
      <div
        className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-lg transition-all duration-500 hover:border-teal-500/40 hover:bg-slate-900/60 text-left flex flex-row items-center p-5 w-[85vw] md:w-auto flex-shrink-0 snap-center animate-in slide-in-from-bottom-8 fill-mode-both"
        style={{ animationDelay: `${idx * 100}ms` }}
      >
        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500 shrink-0 mr-4">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] sm:text-base font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-300 transition-colors mb-1">{item.title}</h3>
          <p className="text-[14px] text-slate-400 font-medium leading-snug line-clamp-3">{item.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-md shadow-lg transition-all duration-500 hover:border-teal-500/40 hover:bg-slate-900/60 text-left w-full flex flex-col p-6 md:p-8 animate-in slide-in-from-bottom-8 fill-mode-both",
        isDesktop ? item.desktopClass : ""
      )}
      style={{ animationDelay: `${idx * 100}ms` }}
    >
      <div className="flex flex-row items-center md:items-start md:flex-col gap-4 mb-4 md:mb-6">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all duration-500 shrink-0">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          {item.tag && (
            <span className="hidden md:inline-flex text-[14px] font-bold uppercase tracking-widest bg-teal-500/20 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/30 mb-3 md:mb-4">
              {item.tag}
            </span>
          )}
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-teal-300 transition-colors">
            {item.title}
          </h3>
        </div>
      </div>
      <p className="text-[14px] md:text-base text-slate-400 font-medium leading-relaxed">{item.desc}</p>
      {item.features && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-6 pt-6 border-t border-white/10">
          {item.features.map((feat: string) => (
            <li key={feat} className="flex items-start gap-2 text-[14px] md:text-xs font-bold text-slate-300 uppercase tracking-widest text-left">
              <div className="mt-0.5 shrink-0"><CheckCircle2 size={14} className="text-teal-500" /></div>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}