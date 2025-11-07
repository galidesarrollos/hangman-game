import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WordsService } from './words.service';
import { Theme, Level, GameState } from '../models/game.model';
import { AudioService } from 'src/app/services/audio.service';
import { AdmobService } from 'src/app/services/admob.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly MAX_INTENTOS = 6;
  private GameStateSubject: BehaviorSubject<GameState>;
  public GameState$: Observable<GameState>;

  constructor(private palabrasService: WordsService, private audioService: AudioService, private admobService: AdmobService) {
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
      winner: false
    };
  }

  iniciarNuevoJuego(tematica: Theme, Level: Level): void {
    // this.admobService.showInterstitial();
    const palabra = this.palabrasService.obtenerPalabraAleatoria(tematica, Level);
    const nuevoEstado: GameState = {
      secretWord: palabra,
      lettersGuessed: new Set<string>(),
      lettersFailed: new Set<string>(),
      attemptsRemaining: this.MAX_INTENTOS,
      gameOver: false,
      winner: false
    };
    this.GameStateSubject.next(nuevoEstado);
  }

  adivinarLetra(letra: string): void {
    const estadoActual = this.GameStateSubject.value;

    if (estadoActual.gameOver) {
      return;
    }

    const letraMayuscula = letra.toUpperCase();

    if (estadoActual.lettersGuessed.has(letraMayuscula) ||
        estadoActual.lettersFailed.has(letraMayuscula)) {
      return;
    }

    const nuevoEstado = { ...estadoActual };

    if (estadoActual.secretWord.includes(letraMayuscula)) {
      nuevoEstado.lettersGuessed = new Set(estadoActual.lettersGuessed);
      nuevoEstado.lettersGuessed.add(letraMayuscula);
      this.audioService.playSound('acierto');
      if (this.palabraCompletada(estadoActual.secretWord, nuevoEstado.lettersGuessed)) {
        nuevoEstado.gameOver = true;
        nuevoEstado.winner = true;
        this.admobService.showBannerTopCenter();
        // this.admobService.showInterstitial();
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
        // this.admobService.showInterstitial();
        this.audioService.playSound('derrota');
      }
    }

    this.GameStateSubject.next(nuevoEstado);
  }

  private palabraCompletada(palabra: string, lettersGuessed: Set<string>): boolean {
    return palabra.split('').every(letra => lettersGuessed.has(letra));
  }

  obtenerPalabraVisible(palabra: string, lettersGuessed: Set<string>): string {
    return palabra
      .split('')
      .map(letra => lettersGuessed.has(letra) ? letra : '_')
      .join(' ');
  }

  reiniciarJuego(): void {
    const estadoInicial = this.crearEstadoInicial();
    this.admobService.showInterstitial();
    this.GameStateSubject.next(estadoInicial);
  }
}
