"use client";
import { motion } from 'framer-motion';

export default function SocialLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <motion.a 
        href={href} 
        target="_blank" 
        rel="noreferrer noopener" 
        aria-label={label} 
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-teal-500/20 hover:border-teal-500/50 transition-all group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
    >
        <div className="group-hover:text-teal-400 transition-colors">
          {icon}
        </div>
    </motion.a>
  );
}