import Image from "next/image";
import { Anchor, XCircle, ShieldAlert, ChevronRight } from "lucide-react";
import SwipeHint from '@/shared/ui/SwipeHint'; 

const rules = [
  { id: 1, image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771522497/1_fnmpfs.jpg", title: "Берег — не место для отдыха", desc: "Не садитесь в байдарку на берегу. Это ломает каркас." },
  { id: 2, image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771522488/2_eciklr.jpg", title: "Забудьте про волочение", desc: "Никогда не тащите байдарку по дну. Оболочка пробивается мгновенно." },
  { id: 3, image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771522489/3_vz2icq.jpg", title: "Лодка — не скамейка", desc: "Вес человека раздавит трубы о камни под шкурой." },
  { id: 4, image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771522492/4_bmyedx.jpg", title: "Командная работа", desc: "Переносим байдарку только вдвоем за специальные ручки." },
  { id: 5, image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771522493/5_myorxy.jpg", title: "Посадка на плаву", desc: "Убедитесь, что байдарка стоит на воде перед тем, как сесть." },
  { id: 6, image: "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771522496/6_vypa6r.jpg", title: "Железная площадка", desc: "Становитесь только на кильсон (центр). На трубы наступать нельзя." },
];

export default function KayakRules() {
  return (
    <section className="py-8 md:py-16 bg-[#020617] text-slate-200 overflow-hidden font-sans border-t border-white/5 relative">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-amber-900/5 md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">

        <div className="flex flex-col text-left mb-6 md:mb-10 max-w-3xl">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-950/30 backdrop-blur-md mb-4 md:mb-6">
              <ShieldAlert size={14} className="text-amber-400" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-amber-400">Сохрани лодку</span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Правила обращения <br className="hidden md:block" />
              <span className="text-amber-500">с байдаркой</span>
            </h2>
            <p className="text-slate-300 font-medium text-[14px] md:text-base leading-relaxed">
              Байдарка — надежное, но деликатное судно. Соблюдайте эти простые правила, чтобы ваш поход не превратился в ремонтные работы посреди реки.
            </p>
          </div>
        </div>

        <div className="relative">
             <div className="mb-3">
                   <SwipeHint /> </div>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="flex-shrink-0 snap-center w-[80vw] md:w-auto group bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-amber-500/40 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-48 w-full grayscale-[50%] group-hover:grayscale-0 transition-all duration-700">
                  <Image
                    src={rule.image}
                    alt={rule.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw"
                    // FIX: lazy — правила ниже fold
                    loading="lazy"
                    // FIX: quality 55 — b&w-карточки с оверлеем, артефакты скрыты
                    quality={55}
                  />
                  <div className="absolute top-4 left-4 w-8 h-8 bg-red-500/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    <XCircle size={18} className="text-white" />
                  </div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                  <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-amber-400 transition-colors leading-tight">
                    {rule.title}
                  </h3>
                  <p className="text-[14px] text-slate-300 leading-relaxed font-medium">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
         </div>

        <div className="mt-6 md:mt-8 p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-r from-teal-900/40 to-slate-900 border border-teal-500/20 flex flex-col md:flex-row items-center gap-6 md:gap-8 animate-in fade-in zoom-in-95 duration-700 fill-mode-both">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.4)]">
            <Anchor size={32} />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl md:text-2xl font-black text-white uppercase mb-2">Золотое правило посадки</h4>
            <p className="text-[14px] md:text-base text-slate-300 max-w-3xl leading-relaxed">
              Становимся одной ногой на кильсон, плавно переносим центр тяжести на сидушку, и только потом поднимаем вторую ногу. Команда в это время стабилизирует байдарку с двух сторон. <strong className="text-white">Байдарка — это командная работа!</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}