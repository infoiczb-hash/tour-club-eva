import { 
  Shield, Dumbbell, Activity, BookOpen, Compass, Brain,
  Backpack, Flame, Sparkles, PawPrint
} from "lucide-react";

export interface QuizVisual {
  color: string;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  badge?: string;
}

export const QUIZ_VISUAL_CONFIG: Record<string, QuizVisual> = {
  'fears': {
    color: "blue",
    icon: Shield,
    iconColor: "text-blue-400",
    borderColor: "group-hover:border-blue-500/50",
    badge: "AI Powered"
  },
  'physical': {
    color: "emerald",
    icon: Dumbbell,
    iconColor: "text-emerald-400",
    borderColor: "group-hover:border-emerald-500/50",
    badge: "AI Powered"
  },
  'signals': {
    color: "rose",
    icon: Activity,
    iconColor: "text-rose-400",
    borderColor: "group-hover:border-rose-500/50",
    badge: "AI Powered"
  },
  'debrief': {
    color: "purple",
    icon: BookOpen,
    iconColor: "text-purple-400",
    borderColor: "group-hover:border-purple-500/50",
    badge: "AI Powered"
  },
  'psych-profile': {
    color: "fuchsia",
    icon: Brain,
    iconColor: "text-fuchsia-400",
    borderColor: "group-hover:border-fuchsia-500/50",
    badge: "AI Powered"
  },
  'tourist-type': {
    color: "amber",
    icon: Compass,
    iconColor: "text-amber-400",
    borderColor: "group-hover:border-amber-500/50"
  },
  'backpack': {
    color: "orange",
    icon: Backpack,
    iconColor: "text-orange-400",
    borderColor: "group-hover:border-orange-500/50"
  },
  'survival': {
    color: "red",
    icon: Flame,
    iconColor: "text-red-400",
    borderColor: "group-hover:border-red-500/50"
  },
  'totem': {
    color: "indigo",
    icon: PawPrint,
    iconColor: "text-indigo-400",
    borderColor: "group-hover:border-indigo-500/50"
  },
  'default': {
    color: "teal",
    icon: Sparkles,
    iconColor: "text-teal-400",
    borderColor: "group-hover:border-teal-500/50"
  },
};
