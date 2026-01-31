import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, TrendingUp, Sparkles, Search, X, Zap } from "lucide-react";

// Моковые данные (лучше потом вынести в data/content.js)
const blogPosts = [
  {
    id: 1,
    title: "Как подготовиться к первому высокогорному походу",
    excerpt: "Полное руководство для новичков: от выбора снаряжения до акклиматизации. Почему важно не спешить и слушать гида.",
    date: "15 марта 2024",
    readTime: "8 мин",
    category: "Снаряжение",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop",
    trending: true,
  },
  {
    id: 2,
    title: "10 секретных мест Молдовы, о которых молчат путеводители",
    excerpt: "Скрытые каньоны, старые мельницы и места силы, которые стоит увидеть своими глазами в эти выходные.",
    date: "10 марта 2024",
    readTime: "5 мин",
    category: "Маршруты",
    image: "https://images.unsplash.com/photo-1519681393784-d8e5b5a4570e?w=800&h=600&fit=crop",
    trending: false,
  },
  {
    id: 3,
    title: "Психология гор: зачем мы туда возвращаемся?",
    excerpt: "Как высота влияет на сознание, почему горы лечат от выгорания и что такое 'горная болезнь' души.",
    date: "5 марта 2024",
    readTime: "12 мин",
    category: "Наука",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
    trending: false,
  },
];

const categories = ["Все", "Снаряжение", "Маршруты", "Истории"];

export default function BlogSection() {
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [activePost, setActivePost] = useState(null);

  const filteredPosts = blogPosts.filter(post => 
    selectedCategory === "Все" || post.category === selectedCategory
  );

  return (
    <section className="relative bg-[#0a0f0d] py-24 overflow-hidden">
       {/* Фоновые элементы */}
       <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-teal-900/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-emerald-900/5 blur-[100px]" />
       </div>

      <div className="relative mx-auto max-w-7xl px-4">
        
        {/* Заголовок */}
        <div className="mb-16 md:text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-900/30 border border-teal-500/20 px-4 py-1.5 mb-6 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-bold text-teal-400 uppercase tracking-wider">База знаний</span>
          </div>
          
          <h2 className="font-condensed text-4xl md:text-6xl font-bold uppercase leading-none text-white mb-6">
            Блог <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">путешественника</span>
          </h2>
          
          <p className="text-slate-400 text-lg">
            Инсайты, гайды и истории от наших гидов. Читайте, вдохновляйтесь и готовьтесь к приключениям правильно.
          </p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                selectedCategory === category 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Сетка постов */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActivePost(post)}
              className="group cursor-pointer flex flex-col h-full"
            >
              {/* Картинка */}
              <div className="relative h-64 overflow-hidden rounded-2xl mb-6 border border-white/10">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                
                <div className="absolute top-4 left-4">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                        {post.category}
                    </span>
                </div>
              </div>

              {/* Контент */}
              <div className="flex flex-col flex-grow">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{post.date}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 leading-snug group-hover:text-teal-400 transition-colors font-condensed uppercase">
                  {post.title}
                </h3>
                
                <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center text-teal-500 text-sm font-bold uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                  Читать статью <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>

      </div>

      {/* Модалка поста (упрощенная) */}
      <AnimatePresence>
        {activePost && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePost(null)}
              className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-0 bottom-0 top-10 z-[70] md:inset-10 md:rounded-3xl bg-[#0f172a] overflow-hidden border border-white/10 shadow-2xl"
            >
               {/* Кнопка закрытия */}
               <button 
                 onClick={() => setActivePost(null)}
                 className="absolute top-6 right-6 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-white/20 transition-colors"
               >
                 <X className="h-6 w-6" />
               </button>

               <div className="h-full overflow-y-auto custom-scrollbar">
                  <div className="relative h-[40vh]">
                     <img src={activePost.image} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
                     <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl">
                        <span className="text-teal-400 font-bold uppercase tracking-widest text-sm mb-2 block">{activePost.category}</span>
                        <h2 className="text-3xl md:text-5xl font-condensed font-bold text-white uppercase">{activePost.title}</h2>
                     </div>
                  </div>
                  <div className="p-8 md:p-12 max-w-3xl mx-auto text-slate-300 leading-relaxed text-lg">
                     <p className="mb-6 font-medium text-xl text-white">{activePost.excerpt}</p>
                     <p>Здесь должен быть полный текст статьи... (Это демо-версия)</p>
                     <p className="mt-4">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Autem, commodi!</p>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
