import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { WordsService } from './words.service';
import { AudioService } from './audio.service';
import { StatsService } from './stats.service';
import { GameState } from '../models/game.model';

describe('GameService', () => {
  let service: GameService;
  let state: any;
  let words: jasmine.SpyObj<WordsService>;
  let audio: jasmine.SpyObj<AudioService>;
  let stats: jasmine.SpyObj<StatsService>;

  beforeEach(() => {
    words = jasmine.createSpyObj<WordsService>('WordsService', ['obtenerPalabraAleatoria', 'obtenerRetoDiario']);
    audio = jasmine.createSpyObj<AudioService>('AudioService', ['playSound']);
    stats = jasmine.createSpyObj<StatsService>('StatsService', [
      'recordResult', 'completeDaily', 'useDailyRetry', 'isDailyAvailable', 'getDailyProgress', 'saveDailyProgress'
    ]);
    stats.isDailyAvailable.and.returnValue(true);
    stats.getDailyProgress.and.returnValue(null);
    words.obtenerPalabraAleatoria.and.returnValue('CASA');
    words.obtenerRetoDiario.and.returnValue({ theme: 'animales', word: 'GATO' });

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: WordsService, useValue: words },
        { provide: AudioService, useValue: audio },
        { provide: StatsService, useValue: stats }
      ]
    });
    service = TestBed.inject(GameService);
    service.GameState$.subscribe(value => state = value);
  });

  it('starts a fresh game using the selected theme and difficulty', () => {
    service.iniciarNuevoJuego('general', 'avanzado');
    expect(words.obtenerPalabraAleatoria).toHaveBeenCalledWith('general', 'avanzado');
    expect(state.secretWord).toBe('CASA');
    expect(state.attemptsRemaining).toBe(7);
    expect(state.gameOver).toBeFalse();
  });

  it('reveals correct letters and ignores repeated guesses', () => {
    service.iniciarNuevoJuego('general', 'normal');
    service.adivinarLetra('a');
    service.adivinarLetra('A');

    expect(state.lettersGuessed.has('A')).toBeTrue();
    expect(state.attemptsRemaining).toBe(7);
    expect(audio.playSound).toHaveBeenCalledTimes(1);
  });

  it('reduces attempts once for an incorrect letter and records a loss at zero', () => {
    service.iniciarNuevoJuego('general', 'normal');
    for (const letter of ['B', 'D', 'E', 'F', 'G', 'H', 'I']) service.adivinarLetra(letter);

    expect(state.attemptsRemaining).toBe(0);
    expect(state.gameOver).toBeTrue();
    expect(state.winner).toBeFalse();
    expect(state.streak).toBe(0);
    expect(stats.recordResult).toHaveBeenCalledWith(false, 0);
  });

  it('awards score and records a win once the complete word is guessed', () => {
    service.iniciarNuevoJuego('general', 'normal');
    for (const letter of ['C', 'A', 'S']) service.adivinarLetra(letter);

    expect(state.gameOver).toBeTrue();
    expect(state.winner).toBeTrue();
    expect(state.score).toBe(70);
    expect(state.streak).toBe(1);
    expect(stats.recordResult).toHaveBeenCalledWith(true, 1);
  });

  it('uses and completes the daily challenge when the daily game ends', () => {
    service.iniciarNuevoJuego('general', 'diario');
    for (const letter of ['B', 'C', 'D', 'E', 'F', 'H', 'I']) service.adivinarLetra(letter);

    expect(words.obtenerRetoDiario).toHaveBeenCalled();
    expect(state.theme).toBe('animales');
    expect(stats.completeDaily).toHaveBeenCalledWith(false);
  });

  it('saves a daily win separately from a daily loss', () => {
    service.iniciarNuevoJuego('general', 'diario');
    for (const letter of ['G', 'A', 'T', 'O']) service.adivinarLetra(letter);

    expect(state.winner).toBeTrue();
    expect(stats.completeDaily).toHaveBeenCalledWith(true);
  });

  it('rejects a completed daily challenge even when started directly', () => {
    stats.isDailyAvailable.and.returnValue(false);

    expect(service.iniciarNuevoJuego('general', 'diario')).toBeFalse();
    expect(words.obtenerRetoDiario).toHaveBeenCalled();
    expect(state.secretWord).toBe('');
    expect(stats.recordResult).not.toHaveBeenCalled();
  });

  it('resumes an unfinished daily challenge instead of resetting its guesses', () => {
    const progress: GameState = {
      secretWord: 'GATO', theme: 'animales', lettersGuessed: new Set(['G']), lettersFailed: new Set(['Z']),
      attemptsRemaining: 6, gameOver: false, winner: false, score: 0, streak: 0
    };
    stats.getDailyProgress.and.returnValue(progress);
    stats.isDailyAvailable.and.returnValue(false);

    expect(service.iniciarNuevoJuego('general', 'diario')).toBeTrue();
    expect(state.lettersGuessed.has('G')).toBeTrue();
    expect(state.lettersFailed.has('Z')).toBeTrue();
    expect(state.attemptsRemaining).toBe(6);
    expect(stats.saveDailyProgress).not.toHaveBeenCalled();
  });

  it('restarts the same daily word only after an available rewarded retry', () => {
    stats.useDailyRetry.and.returnValue(true);
    service.iniciarNuevoJuego('general', 'diario');
    for (const letter of ['B', 'C', 'D', 'E', 'F', 'H', 'I']) service.adivinarLetra(letter);

    expect(service.reintentarRetoDiario()).toBeTrue();
    expect(state.secretWord).toBe('GATO');
    expect(state.attemptsRemaining).toBe(7);
    expect(state.gameOver).toBeFalse();
    expect(stats.useDailyRetry).toHaveBeenCalledTimes(1);
    expect(service.reintentarRetoDiario()).toBeFalse();
  });

  it('does not retry a normal game through the daily reward', () => {
    service.iniciarNuevoJuego('general', 'normal');
    for (const letter of ['B', 'D', 'E', 'F', 'G', 'H', 'I']) service.adivinarLetra(letter);

    expect(service.reintentarRetoDiario()).toBeFalse();
    expect(stats.useDailyRetry).not.toHaveBeenCalled();
  });

  it('shows guessed letters and masks the rest', () => {
    expect(service.obtenerPalabraVisible('CASA', new Set(['A', 'S']))).toBe('_ A S A');
  });

  it('treats Ñ as a different letter from N', () => {
    words.obtenerPalabraAleatoria.and.returnValue('NIÑO');
    service.iniciarNuevoJuego('general', 'normal');

    service.adivinarLetra('N');
    expect(service.obtenerPalabraVisible(state.secretWord, state.lettersGuessed)).toBe('N _ _ _');

    service.adivinarLetra('Ñ');
    expect(service.obtenerPalabraVisible(state.secretWord, state.lettersGuessed)).toBe('N _ Ñ _');
  });

  it('reveals an unguessed letter when using a hint', () => {
    service.iniciarNuevoJuego('general', 'normal');
    spyOn(Math, 'random').and.returnValue(0);

    expect(service.usarPista()).toBeTrue();
    expect(state.lettersGuessed.has('C')).toBeTrue();
    expect(state.attemptsRemaining).toBe(7);
  });

  it('ends an active game when the time trial expires', () => {
    service.iniciarContrarreloj(1);
    service.finalizarPorTiempo();

    expect(state.gameOver).toBeTrue();
    expect(state.winner).toBeFalse();
    expect(state.attemptsRemaining).toBe(0);
    expect(stats.recordResult).toHaveBeenCalledWith(false, 0);
  });
});
