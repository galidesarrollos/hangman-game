export type Theme = 'deportes' | 'ciencia' | 'infantil' | 'general' | 'animales' | 'comida' | 'naturaleza' | 'tecnologia';
export type Level = 'facil' | 'normal' | 'avanzado' | 'diario' | 'contrarreloj';

export type Sounds = 'acierto' | 'error' | 'victoria' | 'derrota';

export interface GameState {
  secretWord: string;
  lettersGuessed: Set<string>;
  lettersFailed: Set<string>;
  attemptsRemaining: number;
  gameOver: boolean;
  winner: boolean;
  lossReason?: 'time' | 'attempts';
  score: number;
  streak: number;
  theme?: Theme;
}
