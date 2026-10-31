import { Injectable } from '@angular/core';
import { Theme, Level } from '../models/game.model';
import * as words from '../../assets/words.json';

type PlayableLevel = Extract<Level, 'facil' | 'normal' | 'avanzado'>;
type WordBank = Record<Theme, Record<PlayableLevel, string[]>>;

export interface DailyChallenge {
  theme: Theme;
  word: string;
}

@Injectable({ providedIn: 'root' })
export class WordsService {
  private readonly moduloPalabras = words as unknown as { default?: WordBank } & WordBank;
  private readonly palabras = this.moduloPalabras.default ?? this.moduloPalabras;
  private usadas = new Map<string, Set<string>>();
  private readonly historyPrefix = 'hangman-words-v2:';

  obtenerPalabraAleatoria(tematica: Theme, nivel: Level): string {
    if (nivel !== 'facil' && nivel !== 'normal' && nivel !== 'avanzado') return 'ERROR';
    const clave = `${tematica}-${nivel}`;
    const lista = (this.palabras[tematica]?.[nivel] ?? [])
      .filter(palabra => /^[a-záéíóúüñ]+$/i.test(palabra));
    if (lista.length === 0) return 'ERROR';
    const usadas = this.obtenerUsadas(clave, lista);
    if (usadas.size >= lista.length) {
      const recientes = [...usadas].slice(-Math.min(5, lista.length - 1));
      usadas.clear();
      recientes.forEach(palabra => usadas.add(palabra));
    }
    const disponibles = lista.filter(palabra => !usadas.has(palabra));
    const palabra = disponibles[Math.floor(Math.random() * disponibles.length)];
    usadas.add(palabra);
    this.usadas.set(clave, usadas);
    this.guardarUsadas(clave, usadas);
    return palabra.toUpperCase();
  }

  private obtenerUsadas(clave: string, lista: string[]): Set<string> {
    const enMemoria = this.usadas.get(clave);
    if (enMemoria) return enMemoria;
    try {
      const guardadas: unknown = JSON.parse(localStorage.getItem(this.historyPrefix + clave) ?? '[]');
      if (Array.isArray(guardadas)) {
        const validas = new Set(lista);
        return new Set(guardadas.filter((palabra): palabra is string =>
          typeof palabra === 'string' && validas.has(palabra)));
      }
    } catch (error) {
      console.warn('No se pudo recuperar el historial de palabras:', error);
    }
    return new Set<string>();
  }

  private guardarUsadas(clave: string, usadas: Set<string>): void {
    try {
      localStorage.setItem(this.historyPrefix + clave, JSON.stringify([...usadas]));
    } catch (error) {
      console.warn('No se pudo guardar el historial de palabras:', error);
    }
  }

  obtenerRetoDiario(fecha = new Date()): DailyChallenge {
    const clave = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
    const tematicas = Object.keys(this.palabras) as Theme[];
    const tema = tematicas[this.indiceDelDia(`${clave}-tema`, tematicas.length)];
    const palabras = Object.values(this.palabras[tema]).reduce((todas, lista) => todas.concat(lista), [] as string[])
      .filter(palabra => /^[a-záéíóúüñ]+$/i.test(palabra) && /[aeiouáéíóú]/i.test(palabra));

    if (palabras.length === 0) {
      throw new Error(`No hay palabras válidas para el reto diario de la temática ${tema}.`);
    }

    const palabra = palabras[this.indiceDelDia(`${clave}-${tema}-palabra`, palabras.length)];
    return { theme: tema, word: palabra.toUpperCase() };
  }

  private indiceDelDia(clave: string, longitud: number): number {
    const hash = Array.from(clave).reduce((total, caracter) => (total * 31 + caracter.charCodeAt(0)) >>> 0, 7);
    return hash % longitud;
  }
}
