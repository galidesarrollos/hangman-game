export type Theme = 'deportes' | 'ciencia' | 'infantil' | 'general' | 'animales' | 'comida' | 'naturaleza' | 'tecnologia';
export type Level = 'facil' | 'normal' | 'avanzado' | 'diario';

export type Sounds = 'acierto' | 'error' | 'victoria' | 'derrota';

export interface WordData {
  theme: Theme;
  level: Level;
  words: string[];
}

export interface GameState {
  secretWord: string;
  lettersGuessed: Set<string>;
  lettersFailed: Set<string>;
  attemptsRemaining: number;
  gameOver: boolean;
  winner: boolean;
  score: number;
  streak: number;
  theme?: Theme;
}
