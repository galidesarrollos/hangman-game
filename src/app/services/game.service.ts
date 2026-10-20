import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WordsService } from './words.service';
import { Theme, Level, GameState } from '../models/game.model';
import { AudioService } from 'src/app/services/audio.service';
import { StatsService } from './stats.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly palabrasService = inject(WordsService);
  private readonly audioService = inject(AudioService);
  private readonly statsService = inject(StatsService);

  private readonly MAX_INTENTOS = 7;
  private GameStateSubject: BehaviorSubject<GameState>;
  public GameState$: Observable<GameState>;
  private currentLevel: Level = 'normal';

  constructor() {
    const estadoInicial = this.crearEstadoInicial();
    this.GameStateSubject = new BehaviorSubject<GameState>(estadoInicial);
    this.GameState$ = this.GameStateSubject.asObservable();
  }

  private crearEstadoInicial(): GameState {
    return {
      secretWord: '',
      lettersGuessed: new Set<string>(),
      lettersFailed: new Set<string>(),
      attemptsRemaining: this.MAX_INTENTOS,
      gameOver: false,
      winner: false,
      score: 0,
      streak: 0
    };
  }

  iniciarNuevoJuego(tematica: Theme, level: Level): void {
    this.currentLevel = level;
    const retoDiario = level === 'diario' ? this.palabrasService.obtenerRetoDiario() : undefined;
    const palabra = retoDiario?.word ?? this.palabrasService.obtenerPalabraAleatoria(tematica, level);
    const temaPartida = retoDiario?.theme ?? tematica;
    const estadoAnterior = this.GameStateSubject.value;
    const nuevoEstado: GameState = {
      secretWord: palabra,
      lettersGuessed: new Set<string>(),
      lettersFailed: new Set<string>(),
      attemptsRemaining: this.MAX_INTENTOS,
      gameOver: false,
      winner: false,
      score: estadoAnterior.score,
      streak: estadoAnterior.streak,
      theme: temaPartida
    };
    this.GameStateSubject.next(nuevoEstado);
  }

  reintentarRetoDiario(): boolean {
    const estado = this.GameStateSubject.value;
    if (this.currentLevel !== 'diario' || !estado.gameOver || estado.winner || !this.statsService.useDailyRetry()) return false;
    this.iniciarNuevoJuego(estado.theme ?? 'general', 'diario');
    return true;
  }

  adivinarLetra(letra: string): void {
    const estadoActual = this.GameStateSubject.value;

    if (estadoActual.gameOver) {
      return;
    }

    const letraMayuscula = this.normalizar(letra);

    if (estadoActual.lettersGuessed.has(letraMayuscula) ||
        estadoActual.lettersFailed.has(letraMayuscula)) {
      return;
    }

    const nuevoEstado = { ...estadoActual };

    if (this.normalizar(estadoActual.secretWord).includes(letraMayuscula)) {
      nuevoEstado.lettersGuessed = new Set(estadoActual.lettersGuessed);
      nuevoEstado.lettersGuessed.add(letraMayuscula);
      this.audioService.playSound('acierto');
      if (this.palabraCompletada(estadoActual.secretWord, nuevoEstado.lettersGuessed)) {
        nuevoEstado.gameOver = true;
        nuevoEstado.winner = true;
        nuevoEstado.score += nuevoEstado.attemptsRemaining * 10;
        nuevoEstado.streak += 1;
        this.statsService.recordResult(true, nuevoEstado.streak);
        if (this.currentLevel === 'diario') this.statsService.completeDaily();
        this.audioService.playSound('victoria');
      }
    } else {
      nuevoEstado.lettersFailed = new Set(estadoActual.lettersFailed);
      nuevoEstado.lettersFailed.add(letraMayuscula);
      nuevoEstado.attemptsRemaining = estadoActual.attemptsRemaining - 1;
      this.audioService.playSound('error');
      if (nuevoEstado.attemptsRemaining === 0) {
        nuevoEstado.gameOver = true;
        nuevoEstado.winner = false;
        nuevoEstado.streak = 0;
        this.statsService.recordResult(false, 0);
        if (this.currentLevel === 'diario') this.statsService.completeDaily();
        this.audioService.playSound('derrota');
      }
    }

    this.GameStateSubject.next(nuevoEstado);
  }

  private palabraCompletada(palabra: string, lettersGuessed: Set<string>): boolean {
    return this.normalizar(palabra).split('').every(letra => lettersGuessed.has(letra));
  }

  obtenerPalabraVisible(palabra: string, lettersGuessed: Set<string>): string {
    return palabra
      .split('')
      .map(letra => lettersGuessed.has(this.normalizar(letra)) ? letra : '_')
      .join(' ');
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }
}
