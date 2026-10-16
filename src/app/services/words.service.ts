import { Injectable } from '@angular/core';
import { Theme, Level } from '../models/game.model';
import * as words from '../../assets/words.json';

type WordBank = Record<Theme, Record<Level, string[]>>;

export interface DailyChallenge {
  theme: Theme;
  word: string;
}

@Injectable({ providedIn: 'root' })
export class WordsService {
  private readonly moduloPalabras = words as unknown as { default?: WordBank } & WordBank;
  private readonly palabras = this.moduloPalabras.default ?? this.moduloPalabras;
  private usadas = new Map<string, Set<string>>();

  obtenerPalabraAleatoria(tematica: Theme, nivel: Level): string {
    const clave = `${tematica}-${nivel}`;
    const lista = (this.palabras[tematica]?.[nivel] ?? [])
      .filter(palabra => /^[a-záéíóúüñ]+$/i.test(palabra));
    if (lista.length === 0) return 'ERROR';
    let usadas = this.usadas.get(clave) ?? new Set<string>();
    if (usadas.size >= lista.length) usadas = new Set<string>();
    const disponibles = lista.filter(palabra => !usadas.has(palabra));
    const palabra = disponibles[Math.floor(Math.random() * disponibles.length)];
    usadas.add(palabra);
    this.usadas.set(clave, usadas);
    return palabra.toUpperCase();
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
