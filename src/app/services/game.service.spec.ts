import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { WordsService } from './words.service';
import { AudioService } from './audio.service';
import { StatsService } from './stats.service';

describe('GameService', () => {
  let service: GameService;
  let state: any;
  let words: jasmine.SpyObj<WordsService>;
  let audio: jasmine.SpyObj<AudioService>;
  let stats: jasmine.SpyObj<StatsService>;

  beforeEach(() => {
    words = jasmine.createSpyObj<WordsService>('WordsService', ['obtenerPalabraAleatoria', 'obtenerRetoDiario']);
    audio = jasmine.createSpyObj<AudioService>('AudioService', ['playSound']);
    stats = jasmine.createSpyObj<StatsService>('StatsService', ['recordResult', 'completeDaily', 'useDailyRetry']);
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
    expect(stats.completeDaily).toHaveBeenCalled();
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
});
