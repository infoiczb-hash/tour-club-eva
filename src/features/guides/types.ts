// src/features/guides/types.ts
export interface Guide {
  id: string;
  slug: string;
  name: string;
  role: string;
  image: string | null;       
  actionImage: string | null; 
  bio: string | null;
  fullBio: string | null;
  superpower: string | null;
  experience: string | null;
  tags: string[];
  achievements: string[];
  quotes: string[];
  stats: any; 
  instagram: string | null;
  telegram: string | null;
  contact?: string | null;
  order: number;
  isActive?: boolean;
}