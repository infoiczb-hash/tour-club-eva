import { Heart } from "lucide-react";

export default function AnimatedHeart() {
  return (
    <span className="inline-block mx-1 animate-pulse">
        <Heart className="h-3 w-3 text-red-500 fill-red-500" />
    </span> 
  );
}