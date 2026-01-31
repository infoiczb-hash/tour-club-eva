import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, Sparkles, Award, X, ChevronRight } from "lucide-react"

// Данные
const guides = [
  {
    id: 1,
    name: "Санду Роман",
    role: "Туристический гид",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
    superpower: "Играет на гитаре",
    experience: "20 лет",
    bio: "Провел более 30 туров и походов. Специалист по походной кухне и разговорам о жизни. Знает, где найти лучший вид на рассвет.",
    achievements: ["Хранитель собаки Эва", "Автор блога Школа туризма"],
    contact: "@romansvtirase",
  },
  {
    id: 2,
    name: "Алексей Батрынча",
    role: "Туристический гид",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800",
    superpower: "Специалист по детям",
    experience: "12 лет",
    bio: "Любитель танцев и молдавского фольклора. Прививает туризм подросткам. Знает как выжить в любой ситуации.",
    achievements: ["Спасатель", "Основатель клуба 'Атлас'"], 
    contact: "@batrancha.alex",
  },
]

export default function GuidesSection() {
  const [selectedGuide, setSelectedGuide] = useState(null)

  return (
    <>
      {/* 1. ФОН: bg-slate-50 (Светло-серый, почти белый) вместо черного */}
      <section className="relative overflow-hidden bg-slate-50 py-16">
        
        {/* Фоновые узоры (еле заметные серые) */}
        <div className="absolute inset-0 opacity-[0.4]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} 
        />

        <div className="relative mx-auto max-w-7xl px-4">
          
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* ЛЕВАЯ КОЛОНКА */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
               
               {/* Заголовок "Команда" - теперь светло-серый */}
               <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-slate-200 font-condensed font-bold uppercase text-5xl md:text-6xl mb-2 block leading-none select-none"
               >
                  Команда
               </motion.h3>

               {/* Основной заголовок - Темный (slate-900) */}
               <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-condensed text-3xl md:text-4xl font-bold uppercase leading-tight text-slate-900 mb-6"
               >
                  Люди, которым <br/>
                  <span className="text-teal-600">
                    можно доверять
                  </span>
               </motion.h2>

               {/* Текст описания - Темно-серый (slate-600) */}
               <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md"
               >
                  Мы не просто водим группы. Мы создаем атмосферу безопасности и легкости, 
                  чтобы вы могли отключить голову и наслаждаться моментом.
               </motion.p>
            </div>

            {/* ПРАВАЯ КОЛОНКА: Карточки гидов */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {guides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedGuide(guide)}
                  // КАРТОЧКА: Белый фон, тень, рамка
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex flex-col sm:flex-row">
                    
                    {/* ФОТО */}
                    <div className="relative h-72 sm:h-80 sm:w-72 shrink-0 overflow-hidden">
                      <img 
                        src={guide.image} 
                        alt={guide.name} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Градиент на фото оставим, чтобы текст (если будет) читался, но сделаем его мягче */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* КОНТЕНТ КАРТОЧКИ */}
                    <div className="p-6 flex flex-col justify-center w-full relative min-h-[200px]">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                {/* Имя гида - Темное */}
                                <h3 className="font-condensed text-2xl font-bold text-slate-900 uppercase">
                                    {guide.name}
                                </h3>
                                <p className="text-teal-600 text-xs font-bold uppercase tracking-wider mt-1">
                                    {guide.role} • {guide.experience}
                                </p>
                            </div>
                            
                            {/* Стрелка - Темно-серая */}
                            <div className="bg-slate-100 p-2 rounded-full transition-colors -mr-2 -mt-2 group-hover:bg-teal-500">
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                        </div>

                        {/* Био - Серый текст */}
                        <p className="text-slate-600 text-xs line-clamp-4 mb-4 leading-relaxed">
                            {guide.bio}
                        </p>

                        <div className="mt-auto flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-700 border border-teal-100">
                                <Sparkles className="h-3 w-3" />
                                {guide.superpower}
                            </div>
                            
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest sm:hidden">
                                Подробнее
                            </span>
                        </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* МОДАЛКА (Оставим темной для контраста и киношности, или хочешь светлую?) */}
      {/* Я пока оставил ТЕМНУЮ, так как всплывающие окна круто смотрятся в "режиме кинотеатра" */}
      <AnimatePresence>
        {selectedGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuide(null)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
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
