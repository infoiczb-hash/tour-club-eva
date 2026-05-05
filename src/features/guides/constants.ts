// src/features/guides/constants.ts
import { Zap, Utensils, Sparkles, Flame, Activity, Heart, Compass } from 'lucide-react';
import type { ElementType } from 'react';

export const ICON_MAP: Record<string, { icon: ElementType, color: string }> = {
  Zap: { icon: Zap, color: "text-amber-400" },
  Utensils: { icon: Utensils, color: "text-rose-400" },
  Sparkles: { icon: Sparkles, color: "text-purple-400" },
  Flame: { icon: Flame, color: "text-teal-400" },
  Activity: { icon: Activity, color: "text-sky-400" },
  Heart: { icon: Heart, color: "text-red-500" },
  Compass: { icon: Compass, color: "text-emerald-400" },
};