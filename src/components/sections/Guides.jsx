import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, MessageCircle, Sparkles, Map, Award, Heart, ChevronRight, X, Phone } from "lucide-react"

// Данные (заглушки)
const guides = [
  {
    id: 1,
    name: "Александр Петров",
    role: "Горный гид",
    // Используем внешние ссылки для демо, заменишь на свои локальные пути
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1000",
    superpower: "Играет на гитаре у костра",
    experience: "12 лет",
    bio: "Провел более 150 походов. Специалист по горной медицине. Любит рассказывать легенды о горах. Знает, где найти лучший вид на рассвет.",
    achievements: ["Покорил Эверест", "Спас 3 группы", "Автор книги 'Горы зовут'"],
    contact: "@alex_mountain",
    stats: { trips: 150, altitude: 8848, happyClients: 1200 }
  },
  {
    id: 2,
    name: "Мария Иванова",
    role: "Инструктор по сплаву",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=1000",
    superpower: "Видит красоту в деталях",
    experience: "8 лет",
    bio: "Фотограф и путешественник. Проводит фото-походы. Знает все тайные тропы Алтая и как развести огонь под дождем.",
    achievements: ["Победитель фотоконкурса", "Основатель школы выживания", "Спасатель"],
    contact: "@maria_river",
    stats: { trips: 85, rivers: 24, happyClients: 850 }
  },
 ]

export function GuidesSection() {
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)

  return (
    <>
      <section className="relative overflow-hidden bg-[#0a0f0d] px-4 py-24">
        
        {/* Background Gradients (Subtle) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-teal-900/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-emerald-900/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-20 max-w-3xl">
                        
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-condensed text-5xl md:text-7xl font-bold uppercase leading-[0.9] text-white mb-6"
            >
              С тобой будут <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">
                наши гиды
              </span>
            </motion.h2>
            
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-400 font-light leading-relaxed max-w-2xl"
            >
              Мы проводники в мир приключений, 
              которые умеют быть рядом, слышать и создавать незабываемые моменты.
            </motion.p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide, index) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onMouseEnter={() => setHoveredCard(guide.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedGuide(guide)}
                className="group relative cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-[420px] overflow-hidden rounded-[2rem] bg-slate-800">
                  <motion.img
                    src={guide.image}
                    alt={guide.name}
                    animate={hoveredCard === guide.id ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.7 }}
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                  {/* Superpower Badge */}
                  <div className="absolute top-4 left-4">
                     <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-teal-400" />
                        {guide.superpower}
                     </div>
                  </div>

                  {/* Name & Role (Bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform transition-transform duration-500 group-hover:-translate-y-2">
                    <h3 className="font-condensed text-3xl font-bold text-white uppercase mb-1">
                      {guide.name}
                    </h3>
                    <p className="text-teal-400 font-medium text-sm flex items-center gap-2 mb-4">
                        {guide.role}
                        <span className="w-1 h-1 bg-white/50 rounded-full" />
                        {guide.experience}
                    </p>

                    {/* Button reveals on hover */}
                    <div className="overflow-hidden h-0 group-hover:h-12 transition-all duration-300">
                        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-teal-400 transition-colors">
                            Подробнее <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL */}
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
                className="pointer-events-auto relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl custom-scrollbar"
                >
                <button
                    onClick={() => setSelectedGuide(null)}
                    className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-white/20 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
                
                <div className="grid md:grid-cols-2">
                    {/* Modal Image */}
                    <div className="relative h-64 md:h-auto">
                        <img
                            src={selectedGuide.image || "/placeholder.svg"}
                            alt={selectedGuide.name}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] md:bg-gradient-to-r md:from-transparent md:to-[#0f172a]" />
                    </div>

                    {/* Modal Content */}
                    <div className="p-8">
                        <h2 className="font-condensed text-4xl font-bold text-white uppercase mb-2">
                            {selectedGuide.name}
                        </h2>
                        <p className="text-teal-400 text-lg mb-6">{selectedGuide.role}</p>

                        <p className="text-slate-300 leading-relaxed mb-8 border-l-2 border-white/10 pl-4">
                            {selectedGuide.bio}
                        </p>

                        {/* Achievements */}
                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Достижения</h4>
                            <ul className="space-y-3">
                                {selectedGuide.achievements.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                                        <Award className="h-4 w-4 text-teal-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-xl font-bold text-white">{selectedGuide.stats.trips}</div>
                                <div className="text-[10px] uppercase text-white/50 tracking-wider">Походов</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-xl font-bold text-white">{selectedGuide.stats.happyClients}</div>
                                <div className="text-[10px] uppercase text-white/50 tracking-wider">Клиентов</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-xl font-bold text-white flex items-center justify-center gap-1">5.0 <Heart className="h-3 w-3 fill-red-500 text-red-500"/></div>
                                <div className="text-[10px] uppercase text-white/50 tracking-wider">Рейтинг</div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex gap-3">
                            <button className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <MessageCircle className="h-5 w-5" /> Написать
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
