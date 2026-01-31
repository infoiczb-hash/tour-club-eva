import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, MessageCircle, Sparkles, Award, Heart, X, ChevronRight } from "lucide-react"

// Данные
const guides = [
  {
    id: 1,
    name: "Санду Роман",
    role: "Туристический гид",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
    superpower: "Играет на гитаре",
    experience: "20 лет",
    bio: "Провел более 30 туров и походов. Специалист по походной кухне и разгворам о жизни. Знает, где найти лучший вид на рассвет.",
    achievements: ["Хранитель собаки Эва", "Автор блока Школа Ментального туризма"],
    contact: "@romansvtirase",
      },
  {
    id: 2,
    name: "Алексей Батрынча",
    role: "Туристический гиду",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600",
    superpower: "Специалист по детям",
    experience: "12 лет",
    bio: "Любитель танцев и молдавского фольклера. Прививает туризм подросткам. Знает как выжить в любой ситуации.",
    achievements: ["Спасатель", "Основатель группы идейнных туристов "Атлас"],
    contact: "@batrancha.alex",
      },
]

export default function GuidesSection() {
  const [selectedGuide, setSelectedGuide] = useState(null)

  return (
    <>
      <section className="relative overflow-hidden bg-[#0a0f0d] py-20 border-t border-white/5">
        
        {/* Фоновые пятна (чуть меньше и прозрачнее) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-900/10 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-emerald-900/10 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* ЛЕВАЯ КОЛОНКА: Текст (Занимает 5 колонок) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
               <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-teal-600 font-bold tracking-widest uppercase text-xs mb-3 block"
               >
                  Команда
               </motion.span>

               <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-condensed text-4xl md:text-5xl font-bold uppercase leading-none text-white mb-6"
               >
                  Люди, которым <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">
                    можно доверять
                  </span>
               </motion.h2>

               <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md"
               >
                  Мы не просто водим группы. Мы создаем атмосферу безопасности и легкости, 
                  чтобы вы могли отключить голову и наслаждаться моментом.
               </motion.p>

               {/* Декоративная кнопка или ссылка */}
               <div className="hidden lg:block">
                  <a href="/team" className="text-white text-xs font-bold uppercase tracking-wider border-b border-teal-500/50 pb-1 hover:text-teal-400 transition-colors">
                    Вся команда (скоро)
                  </a>
               </div>
            </div>

            {/* ПРАВАЯ КОЛОНКА: Карточки гидов (Занимает 7 колонок) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {guides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedGuide(guide)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors duration-300"
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    
                    {/* Фото (слева в карточке) - компактное */}
                    <div className="sm:w-48 h-48 sm:h-auto relative shrink-0">
                      <img 
                        src={guide.image} 
                        alt={guide.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/80 opacity-60" />
                    </div>

                    {/* Контент (справа в карточке) */}
                    <div className="p-6 flex flex-col justify-center w-full relative">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-condensed text-2xl font-bold text-white uppercase">
                                    {guide.name}
                                </h3>
                                <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mt-1">
                                    {guide.role} • {guide.experience}
                                </p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                                <ChevronRight className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                            {guide.bio}
                        </p>

                        <div className="mt-auto flex items-center gap-3">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-[10px] font-bold text-teal-400 border border-teal-500/20">
                                <Sparkles className="h-3 w-3" />
                                {guide.superpower}
                            </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* МОДАЛКА (Оставили как есть, она хорошая) */}
      <AnimatePresence>
        {selectedGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuide(null)}
              className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm"
            />
            
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl custom-scrollbar"
                >
                <button
                    onClick={() => setSelectedGuide(null)}
                    className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-white/20 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
                
                <div className="grid md:grid-cols-2">
                    <div className="relative h-64 md:h-auto">
                        <img src={selectedGuide.image} alt={selectedGuide.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="p-8">
                        <h2 className="font-condensed text-3xl font-bold text-white uppercase mb-1">{selectedGuide.name}</h2>
                        <p className="text-teal-400 text-sm mb-6">{selectedGuide.role}</p>

                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{selectedGuide.bio}</p>

                        <div className="space-y-2 mb-6">
                            {selectedGuide.achievements.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                    <Award className="h-3 w-3 text-teal-500" /> {item}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors">
                                Написать гиду
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors">
                                <Instagram className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
                </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
