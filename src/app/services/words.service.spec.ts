import { WordsService } from './words.service';
import { Theme, Level } from '../models/game.model';
import * as wordData from '../../assets/words.json';

describe('WordsService', () => {
  let service: WordsService;
  const importedBank = wordData as unknown as { default?: Record<string, Record<string, string[]>> } & Record<string, Record<string, string[]>>;
  const bank = importedBank.default ?? importedBank;

  beforeEach(() => {
    Object.keys(localStorage).filter(key => key.startsWith('hangman-words-v2:'))
      .forEach(key => localStorage.removeItem(key));
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
    const next = service.obtenerPalabraAleatoria('ciencia', 'normal');
    expect(next).toBe(selected[0]);
    expect(next).not.toBe(selected[selected.length - 1]);
  });

  it('remembers used words after creating a new service instance', () => {
    spyOn(Math, 'random').and.returnValue(0);
    const first = service.obtenerPalabraAleatoria('comida', 'facil');
    const nextSession = new WordsService();

    expect(nextSession.obtenerPalabraAleatoria('comida', 'facil')).not.toBe(first);
  });

  it('keeps sizeable, distinct and valid lists for every theme and difficulty', () => {
    for (const theme of Object.keys(bank) as Theme[]) {
      const all = new Set<string>();
      for (const level of ['facil', 'normal', 'avanzado'] as const) {
        const list = bank[theme][level];
        expect(list.length).withContext(`${theme} ${level}`).toBeGreaterThanOrEqual(30);
        for (const word of list) {
          expect(word).withContext(`${theme} ${level}`).toMatch(/^[a-záéíóúüñ]+$/);
          expect(all.has(word)).withContext(`${theme}: ${word} repetida`).toBeFalse();
          all.add(word);
          if (level === 'facil') expect(word.length).withContext(`${theme}: ${word}`).toBeLessThanOrEqual(6);
        }
      }
    }
  });

  it('returns the same valid daily word and category for the same date', () => {
    const date = new Date(2026, 4, 17);
    const first = service.obtenerRetoDiario(date);
    const second = service.obtenerRetoDiario(date);

    expect(second).toEqual(first);
    expect(bank[first.theme]['facil'].concat(bank[first.theme]['normal'], bank[first.theme]['avanzado']))
      .toContain(first.word.toLowerCase());
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
      expect(bank[theme]['facil'].some(word => word.includes('ñ'))).withContext(`${theme} fácil`).toBeTrue();
      expect(bank[theme]['avanzado'].some(word => word.includes('ñ'))).withContext(`${theme} avanzado`).toBeTrue();
    }
  });
});
