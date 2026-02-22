'use client';

import { motion } from 'framer-motion';
import { Check, Map, Compass, Sparkles } from 'lucide-react';

export default function HikesMeaning() {
  return (
    <section className="py-12 md:py-20 bg-stone-900 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 max-w-5xl">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
            ДРУГОЙ <span className="text-teal-500">МАСШТАБ</span>
          </h2>
          <p className="text-stone-400 font-medium text-base md:text-lg max-w-2xl mx-auto">
            Местные походы идеальны для выходного дня. Но настоящая перезагрузка требует полной смены декораций и выхода за рамки привычного.
          </p>
        </motion.div>

        {/* Сравнение двух форматов (Компактно) */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">

          {/* Локальные походы (Приглушенная карточка) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-stone-950/50 rounded-3xl p-6 md:p-8 border border-stone-800 flex flex-col justify-center"
          >
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center border border-stone-800">
                    <Map size={24} className="text-stone-500" />
                </div>
                <h3 className="text-xl font-bold text-stone-300 uppercase tracking-tight">
                  Домашние тропы
                </h3>
            </div>
            <ul className="space-y-3 text-stone-500 font-medium text-sm">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                <span>Знакомые пейзажи и короткие маршруты</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                <span>Отличный вариант для обычного уикенда</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                <span>Короткая пауза после рабочей недели</span>
              </li>
            </ul>
          </motion.div>

          {/* Заграничные экспедиции (Акцентная карточка) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-stone-800/40 rounded-3xl p-6 md:p-8 border border-teal-900/30 backdrop-blur-sm relative overflow-hidden flex flex-col justify-center shadow-[0_0_30px_rgba(20,184,166,0.05)]"
          >
            {/* Легкое свечение внутри карточки */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-teal-900/30 rounded-xl flex items-center justify-center border border-teal-700/50">
                    <Compass size={24} className="text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-stone-100 uppercase tracking-tight">
                    Наши Экспедиции
                </h3>
            </div>
            <ul className="space-y-3 font-medium text-sm text-stone-300 relative z-10">
                <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" strokeWidth={3} />
                    <span>Масштаб гор, захватывающий дух</span>
                </li>
                <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" strokeWidth={3} />
                    <span>Погружение в другую культуру и быт</span>
                </li>
                <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" strokeWidth={3} />
                    <span>Настоящий детокс: полное отключение от забот</span>
                </li>
            </ul>
          </motion.div>
        </div>

        {/* Дополнительные тезисы (Компактные теги вместо огромных карточек) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
        >
          {['Другой климат', 'Новые знакомства', 'Вкусная местная еда', 'Ментальная перезагрузка'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-stone-950 rounded-full border border-stone-800">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-stone-400 font-bold text-xs uppercase tracking-wider">{item}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}