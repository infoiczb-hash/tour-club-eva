// src/shared/store/useAiPromptsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedPrompt {
  id: string;
  title: string; // Например: "Анонс сплава (Instagram)"
  text: string;  // Сам длинный промпт/контекст
  createdAt: number;
}

interface AiPromptsState {
  savedPrompts: SavedPrompt[];
  addPrompt: (title: string, text: string) => void;
  removePrompt: (id: string) => void;
}

export const useAiPromptsStore = create<AiPromptsState>()(
  persist(
    (set) => ({
      savedPrompts: [],
      
      addPrompt: (title, text) =>
        set((state) => ({
          savedPrompts: [
            { 
              id: crypto.randomUUID(), 
              title, 
              text, 
              createdAt: Date.now() 
            },
            ...state.savedPrompts,
          ],
        })),
        
      removePrompt: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'eva-ai-prompts-storage', // Ключ для localStorage
    }
  )
);