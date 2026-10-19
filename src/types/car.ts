export type CarCategory =
  | 'todos'
  | 'Clássico'
  | 'Nacional'
  | 'Esportivo'
  | 'Muscle Car'
  | 'Utilitário'
  | 'Viatura / Serviço';

export interface CarItem {
  id: number;
  marca: string;
  modelo: string;
  ano: string;
  fabricante: string;
  categoria: string;
  icon: string;
  foto: string;
}

export interface CarReaction {
  likes: number;
  dislikes: number;
  userChoice: 'like' | 'dislike' | null;
  comment: string;
}

export type ReactionsMap = Record<number, CarReaction>;

export interface CarStoryEntry {
  carId: number;
  marca: string;
  modelo: string;
  story: string;
  updatedAt: string;
}

export type StoriesMap = Record<number, CarStoryEntry>;

export interface SearchLogEntry {
  query: string;
  category: string;
  timestamp: string;
  type: 'busca' | 'ia-scanner';
}
