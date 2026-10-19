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
  categoria: Exclude<CarCategory, 'todos'>;
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
