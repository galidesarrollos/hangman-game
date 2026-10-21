import { Theme } from './game.model';

export interface ThemeOption {
  id: Theme;
  nombre: string;
  icono: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'deportes', nombre: 'Deportes', icono: '⚽' },
  { id: 'ciencia', nombre: 'Ciencia', icono: '🔬' },
  { id: 'infantil', nombre: 'Infantil', icono: '🎨' },
  { id: 'general', nombre: 'General', icono: '📚' },
  { id: 'animales', nombre: 'Animales', icono: '🐾' },
  { id: 'comida', nombre: 'Comida', icono: '🍓' },
  { id: 'naturaleza', nombre: 'Naturaleza', icono: '🌿' },
  { id: 'tecnologia', nombre: 'Tecnología', icono: '💻' }
];

export const THEME_DETAILS = THEME_OPTIONS.reduce((details, { id, nombre, icono }) => {
  details[id] = { nombre, icono };
  return details;
}, {} as Record<Theme, Pick<ThemeOption, 'nombre' | 'icono'>>);
