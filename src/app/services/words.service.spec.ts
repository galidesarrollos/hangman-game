import { WordsService } from './words.service';
import { Theme, Level } from '../models/game.model';
import * as wordData from '../../assets/words.json';

describe('WordsService', () => {
  let service: WordsService;
  const importedBank = wordData as unknown as { default?: Record<string, Record<string, string[]>> } & Record<string, Record<string, string[]>>;
  const bank = importedBank.default ?? importedBank;

  beforeEach(() => {
    service = new WordsService();
  });

  it('returns a word from the selected theme and level without spaces or hyphens', () => {
    const word = service.obtenerPalabraAleatoria('animales', 'normal');
    expect(bank['animales']['normal']).toContain(word.toLowerCase());
    expect(word).toMatch(/^[A-ZÁÉÍÓÚÜÑ]+$/);
  });

  it('does not repeat words until the selected list has been used', () => {
    const words = bank['ciencia']['normal'];
    spyOn(Math, 'random').and.returnValue(0);

    const selected = words.map(() => service.obtenerPalabraAleatoria('ciencia', 'normal'));

    expect(new Set(selected).size).toBe(words.length);
    expect(service.obtenerPalabraAleatoria('ciencia', 'normal')).toBe(selected[0]);
  });

  it('returns the same valid daily word and category for the same date', () => {
    const date = new Date(2026, 4, 17);
    const first = service.obtenerRetoDiario(date);
    const second = service.obtenerRetoDiario(date);

    expect(second).toEqual(first);
    expect((bank[first.theme] as Record<Level, string[]>).normal.concat(
      (bank[first.theme] as Record<Level, string[]>).avanzado
    )).toContain(first.word.toLowerCase());
    expect(first.word).toMatch(/^[A-ZÁÉÍÓÚÜÑ]+$/);
    expect(first.word).toMatch(/[AEIOUÁÉÍÓÚ]/);
  });

  it('produces daily words from all configured categories over a range of dates', () => {
    const themes = new Set<Theme>();
    for (let day = 1; day <= 120; day += 1) {
      themes.add(service.obtenerRetoDiario(new Date(2026, 0, day)).theme);
    }
    expect(themes.size).toBe(Object.keys(bank).length);
  });

  it('includes a word with Ñ for every theme and difficulty', () => {
    for (const theme of Object.keys(bank) as Theme[]) {
      expect(bank[theme]['normal'].some(word => word.includes('ñ'))).withContext(`${theme} normal`).toBeTrue();
      expect(bank[theme]['normal'].some(word => word.includes('ñ') && word.length <= 6)).withContext(`${theme} fácil`).toBeTrue();
      expect(bank[theme]['avanzado'].some(word => word.includes('ñ'))).withContext(`${theme} avanzado`).toBeTrue();
    }
  });
});
