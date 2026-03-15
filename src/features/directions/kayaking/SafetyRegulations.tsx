"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, Anchor, Waves, Navigation, 
  Tent, LifeBuoy, UserCheck, Scale, ChevronDown, AlertCircle
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// ✅ ДОБАВЛЕНО: Импорт глобального хука
import { useInView } from '@/hooks/useInView';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const regulations = [
  { id: "basic", title: "Основные правила", icon: ShieldCheck, items: ["Группу всегда сопровождает инструктор-проводник, ответственный за общую безопасность. (Иное возможно только при снятии ответственности с ТК «Эва»).", "Если не уверены в своих плавательных навыках, обязательно сообщите об этом инструктору перед началом сплава.", "Использование страховочного жилета обязательно для всех участников, без исключений, независимо от умения плавать.", "Строго запрещено находиться в алкогольном опьянении. При нарушении этого правила и отказе от жилета участник несет полную личную ответственность. Несовершеннолетние находятся в жилетах постоянно (даже при купании на привалах).", "Каждый участник обязан соблюдать меры противопожарной безопасности.", "На страховочных жилетах запрещено сидеть как в лодке, так и на суше.", "Обо всех проблемах сообщайте инструктору немедленно.", "Будьте корректны в общении с попутчиками и незнакомыми людьми."] },
  { id: "boarding", title: "Посадка и высадка", icon: Anchor, items: ["Укладывать и выгружать вещи в байдарку нужно только после спуска её на воду.", "При посаде один человек придерживает лодку, второй садится, держась за борта обеими руками, и входит постепенно (сначала одна нога, затем другая). Наступать строго на железный каркас (кильсон), а не на ПВХ-оболочку.", "Парковка происходит под углом против течения на медленной скорости без разгона, либо параллельно берегу.", "При высадке первым выходит ближайший к носу участник, удерживаясь за борта, затем помогает выйти второму. Не выходите одновременно."], alert: "Внимание: Прежде чем выходить, проверьте веслом глубину у берега. Не ориентируйтесь на соседние байдарки — дно может быть с ямами."},
  { id: "on-water", title: "Нахождение на воде", icon: Waves, items: ["Запрещено резко наклоняться в стороны (особенно всем экипажем) и вставать в лодке. Хотите привстать — обопритесь двумя руками за борта или на весло перед собой.", "Запрещено сидеть на боковых бортах и перемещаться по байдарке во время движения.", "Байдарки должны быть в зоне видимости (максимум 200 метров). Если вы впереди и не видите остальных — подождите. Если отстали — догоняйте. Инструктор может назначить передовые и замыкающие экипажи.", "Строго запрещено бросать в воду мусор и бытовые отходы.", "Распределяйте груз равномерно во избежание крена.", "При гребле весла не должны биться о борта. Следите, чтобы они не выпадали в воду, и фиксируйте их на стоянках."] },
  { id: "navigation", title: "Управление байдаркой", icon: Navigation, items: ["При приближении к препятствию замедлите ход. Информируйте соседние экипажи (криком или поднятым веслом). Избегайте коряг, мелководья и торчащих предметов.", "Не врезайтесь в другие байдарки. Все маневры — только веслом! Никаких хватаний за кусты и ветки.", "При появлении волны не подставляйте борт. Волну нужно «резать» носом лодки, заходя на нее под углом.", "Внимательно следите за рыбаками и лесками. При обнаружении снастей смещайтесь к центру реки."] },
  { id: "halts", title: "Привалы и остановки", icon: Tent, items: ["На остановках байдарки должны быть на виду. Не оставляйте снаряжение без присмотра.", "Не ныряйте в воду с деревьев, крутых берегов и причалов (особенно головой вниз).", "Не вбегайте в воду с разбега — на дне могут быть острые камни, ракушки или стекло.", "Спрашивайте разрешение инструктора на любые действия (включая купание и отход от лагеря), кроме санитарных выходов.", "Избегайте конфликтов с отдыхающими на берегу."] },
  { id: "emergency", title: "Критические ситуации", icon: LifeBuoy, items: ["Если вы стремительно набираете воду: сохраняйте спокойствие, координируйте действия и направляйтесь к берегу.", "Находитесь в байдарке настолько долго, насколько это возможно.", "Если пришлось покинуть лодку: держитесь позади неё и толкайте вперёд.", "Никогда не выпускайте из рук весло!"] },
  { id: "instructor", title: "Права инструктора", icon: UserCheck, items: ["Принимать любые меры для безопасности группы, вплоть до изменения или прекращения сплава из-за погоды или ЧС.", "Исключить участника, нарушающего правила и ставящего под угрозу безопасность. Нарушитель доставляется на береговой линии у ближайшего населенного пункта (без компенсации стоимости тура).", "Скорректировать маршрут на месте исходя из физической подготовки группы.", "Составлять акт порчи/потери снаряжения (например, за утопленное весло) согласно прейскуранту."] },
  { id: "responsibility", title: "Ответственность сторон", icon: Scale, items: ["Берегите выданное снаряжение (весла, лодки, жилеты, гермомешки).", "Каждый участник (и законные представители детей) несет материальную ответственность за переданное имущество.", "По окончании сплава необходимо вернуть всё оборудование инструктору в целости. После сплава необходимо снять весь инвентарь с байдарки, отчистить байдарку от мусора. Инвентарь сложить в отведенные места.", "При потере/повреждении имущества по халатности, возмещение ущерба происходит в течение 7 дней.", "При потере или потоплении байдарки экипажем, финансовая ответственность ложится солидарно на всех членов этого экипажа.", "В случае необходимости участники обязаны содействовать заполнению «Акта о происшествии»."] },
];

export default function SafetyRegulations() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  // ✅ ИСПРАВЛЕНО: Явно передаем параметры, чтобы сохранить оригинальное поведение
  const headerView = useInView({ threshold: 0.1, rootMargin: '-30px' });
  const listView = useInView({ threshold: 0.1, rootMargin: '-30px' });

  return (
    <section className="py-12 md:py-20 bg-[#020617] relative overflow-hidden font-sans border-t border-white/5">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-rose-900/5 md:blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">

        {/* HEADER */}
        <div className="text-center mb-12 md:mb-16">
          <div
            ref={headerView.ref}
            style={{ opacity: headerView.inView ? 1 : 0, transform: headerView.inView ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-950/30 backdrop-blur-md mb-4 md:mb-6">
              <AlertCircle size={14} className="text-rose-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Техника безопасности</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Кодекс <span className="text-rose-500"> на сплаве</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
              Соблюдение этих правил обязательно для всех. Инструктор несет ответственность за группу, а вы — за выполнение его команд и сохранность имущества.
            </p>
          </div>
        </div>

        {/* ACCORDION (Чистый CSS Grid) */}
        <div ref={listView.ref} className="space-y-3 md:space-y-4">
          {regulations.map((section, idx) => {
            const isOpen = openIndex === idx;
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                style={{ opacity: listView.inView ? 1 : 0, transform: listView.inView ? 'translateY(0)' : 'translateY(10px)', transition: `opacity 0.4s ease ${idx * 0.04}s, transform 0.4s ease ${idx * 0.04}s` }}
                className={cn(
                  "border rounded-[1.5rem] overflow-hidden transition-all duration-300",
                  isOpen ? "bg-slate-900 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.05)]" : "bg-slate-900/40 border-white/5 hover:border-white/10"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 md:p-6 flex justify-between items-center text-left group"
                >
                  <div className="flex items-center gap-4 pr-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300", isOpen ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-slate-400 group-hover:text-slate-300")}>
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className={cn("text-base md:text-lg font-black transition-colors tracking-tight uppercase", isOpen ? "text-white" : "text-slate-300 group-hover:text-white")}>
                      {idx + 1}. {section.title}
                    </span>
                  </div>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300", isOpen ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white")}>
                    <ChevronDown className={cn("transition-transform duration-300", isOpen && "rotate-180")} size={18} />
                  </div>
                </button>

                {/* Нативная CSS анимация аккордеона через Grid */}
                <div className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}>
                    <div className="overflow-hidden">
                        <div className="px-5 md:px-6 pb-6 pt-2 ml-0 md:ml-14">
                          <ul className="space-y-3">
                            {section.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm md:text-base text-slate-400 font-medium leading-relaxed">
                                <span className="text-rose-500/50 font-bold mt-0.5">{idx + 1}.{i + 1}</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          {section.alert && (
                            <div className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start">
                              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-rose-200/80 font-medium leading-relaxed">{section.alert}</p>
                            </div>
                          )}
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}