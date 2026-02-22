"use client";
import { motion } from 'framer-motion';
import { Heart } from "lucide-react";

export default function AnimatedHeart() {
  return (
    <motion.span 
        animate={{ scale: [1, 1.2, 1] }} 
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="inline-block mx-1"
    >
        <Heart className="h-3 w-3 text-red-500 fill-red-500" />
    </motion.span> 
  );
}