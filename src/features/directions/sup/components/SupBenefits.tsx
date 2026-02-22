'use client';

import { motion } from 'framer-motion';
import { 
  Leaf, Briefcase, ShieldCheck, Camera 
} from 'lucide-react';

const BENEFITS = [
  { 
    icon: Leaf, 
    title: "Эмоциональная перезагрузка", 
    text: "Формат digital detox. Снижение стресса, красивые локации и тишина воды. Восстановите энергию вдали от городской суеты." 
  },
  { 
    icon: Briefcase, 
    title: "Баланс", 
    text: "Развивает координацию, контроль тела и глубокое дыхание. У воды на 3-5 градусов прохладнее. Идеально в жару + можно искупаться." 
  },
  { 
    icon: ShieldCheck, 
    title: "Безопасно для семьи", 
    text: "Доступно детям с 10 лет самостоятельно и с 3 совместно со взрослыми. Детские жилеты предоставляем. Прекрасная возможность для времени с семьей." 
  },
  { 
    icon: Camera, 
    title: "Драйв или Эстетика", 
    text: "Выбирайте сами: расслабление плюс потрясающие фотографии для соцсетей с ракурсов, недоступных с берега или быстрое передвижение на воде." 
  }
];

export default function SupBenefits() {
  return (
    <section className="py-10 md:py-12 bg-slate-950 relative overflow-hidden">
      
      {/* Легкое свечение на фоне */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12"
        >
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                Почему стоит выбрать <span className="text-teal-500">SUP</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto">
                Продуманный до мелочей сервис, где ваша единственная задача — наслаждаться моментом.
            </p>
        </motion.div>

        {/* Сетка из 4 крупных карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {BENEFITS.map((b, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group p-8 md:p-10 bg-slate-900/50 border border-white/5 rounded-[2rem] hover:border-teal-500/30 hover:bg-slate-900 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors duration-300">
                  <b.icon className="text-teal-400 group-hover:text-slate-900 transition-colors" size={28} strokeWidth={1.5} />
              </div>
              <div>
                  <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight group-hover:text-teal-400 transition-colors">{b.title}</h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}