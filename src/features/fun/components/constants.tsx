import { Shield, Dumbbell, Activity, BookOpen, Compass } from "lucide-react";

export const VISUAL_REGISTRY: Record<string, { color: string; icon: any }> = {
  'fear-debrief': { color: "blue", icon: <Shield size={24} /> },
  'physical-readiness': { color: "emerald", icon: <Dumbbell size={24} /> },
  'body-signals': { color: "rose", icon: <Activity size={24} /> },
  'tour-debrief': { color: "purple", icon: <BookOpen size={24} /> },
  'default': { color: "amber", icon: <Compass size={24} /> }
};