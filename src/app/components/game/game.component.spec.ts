import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, IonRouterOutlet, ModalController, Platform, ToastController } from '@ionic/angular';
import { of, Subject } from 'rxjs';
import { GameState, Level } from '../../models/game.model';
import { AdmobService } from '../../services/admob.service';
import { AudioService } from '../../services/audio.service';
import { GameService } from '../../services/game.service';
import { StatsService } from '../../services/stats.service';
import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let fixture: ComponentFixture<GameComponent>;
  let gameStates: Subject<GameState>;
  const game = { GameState$: new Subject<GameState>(), iniciarNuevoJuego: jasmine.createSpy(), iniciarContrarreloj: jasmine.createSpy(), finalizarPorTiempo: jasmine.createSpy(), reintentarRetoDiario: jasmine.createSpy(), usarPista: jasmine.createSpy(), obtenerPalabraVisible: () => '_ _ _ _', adivinarLetra: jasmine.createSpy() };
  const alert = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
  const admob = jasmine.createSpyObj<AdmobService>('AdmobService', ['showBannerBottomCenter', 'showInterstitial', 'showRewardedVideo']);
  const stats = jasmine.createSpyObj<StatsService>('StatsService', ['isDailyRetryAvailable', 'consumeDailyGamesInterstitial', 'getTimeTrialRetriesUnlocked', 'unlockTimeTrialRetry', 'getTimeTrialAttempts', 'startTimeTrialAttempt', 'getTimeTrialRetriesRemaining', 'completeTimeTrial']);
  const platform = jasmine.createSpyObj<Platform>('Platform', ['is']);
  const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
  const audio = jasmine.createSpyObj<AudioService>('AudioService', ['getVolume', 'toggleMute']);

  beforeEach(async () => {
    game.iniciarNuevoJuego.calls.reset();
    game.iniciarContrarreloj.calls.reset();
    game.finalizarPorTiempo.calls.reset();
    game.reintentarRetoDiario.calls.reset();
    game.reintentarRetoDiario.and.returnValue(true);
    game.usarPista.calls.reset();
    game.usarPista.and.returnValue(true);
    admob.showInterstitial.calls.reset();
    admob.showInterstitial.and.resolveTo();
    admob.showRewardedVideo.calls.reset();
    toast.create.calls.reset();
    toast.create.and.resolveTo({ present: () => Promise.resolve() } as HTMLIonToastElement);
    stats.isDailyRetryAvailable.and.returnValue(true);
    stats.consumeDailyGamesInterstitial.calls.reset();
    stats.consumeDailyGamesInterstitial.and.returnValue(false);
    stats.getTimeTrialRetriesUnlocked.and.returnValue(0);
    stats.getTimeTrialAttempts.and.returnValue(1);
    stats.unlockTimeTrialRetry.and.returnValue(true);
    stats.unlockTimeTrialRetry.calls.reset();
    stats.startTimeTrialAttempt.and.returnValue(true);
    stats.startTimeTrialAttempt.calls.reset();
    stats.completeTimeTrial.calls.reset();
    stats.getTimeTrialRetriesRemaining.and.returnValue(2);
    platform.is.and.returnValue(false);
    audio.getVolume.and.returnValue(1);
    gameStates = new Subject<GameState>();
    game.GameState$ = gameStates;
    alert.create.calls.reset();
    alert.create.and.resolveTo({ present: () => Promise.resolve() } as HTMLIonAlertElement);
    await TestBed.configureTestingModule({
      imports: [GameComponent, IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { params: of({ theme: 'general', level: 'normal' }), snapshot: { routeConfig: { path: 'game/:theme/:level' } } } },
        { provide: GameService, useValue: game },
        { provide: ModalController, useValue: {} },
        { provide: AlertController, useValue: alert },
        { provide: IonRouterOutlet, useValue: { nativeEl: document.createElement('div') } },
        { provide: AdmobService, useValue: admob },
        { provide: StatsService, useValue: stats },
        { provide: Platform, useValue: platform },
        { provide: ToastController, useValue: toast },
        { provide: AudioService, useValue: audio }
      ]
    }).overrideComponent(GameComponent, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    fixture.detectChanges();
  });

  it('starts a game using the route theme and level', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(game.iniciarNuevoJuego).toHaveBeenCalledWith('general', 'normal');
  });

  it('toggles all game sounds from the game header control', () => {
    fixture.componentInstance.toggleMute();
    expect(audio.toggleMute).toHaveBeenCalled();
  });

  it('returns to the selected theme levels from the back control', () => {
    const router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.componentInstance.volverANiveles();
    expect(router.navigate).toHaveBeenCalledWith(['/level', 'general']);
  });

  it('asks for confirmation before requesting a rewarded hint outside time trial', async () => {
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 7, gameOver: false, winner: false, score: 0, streak: 0
    });

    await fixture.componentInstance.confirmarPista();
    expect(alert.create.calls.mostRecent().args[0]?.header).toBe('¿Pedir una pista?');
    expect(alert.create.calls.mostRecent().args[0]?.message).toContain('anuncio recompensado');
  });

  it('highlights the hint only with one attempt left in an active regular game', () => {
    const component = fixture.componentInstance;
    const state: GameState = {
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 2, gameOver: false, winner: false, score: 0, streak: 0
    };

    gameStates.next(state);
    expect(component.pistaEnUltimoIntento).toBeFalse();

    gameStates.next({ ...state, attemptsRemaining: 1 });
    expect(component.pistaEnUltimoIntento).toBeTrue();

    component.isTimeTrial = true;
    expect(component.pistaEnUltimoIntento).toBeFalse();

    component.isTimeTrial = false;
    gameStates.next({ ...state, attemptsRemaining: 0, gameOver: true });
    expect(component.pistaEnUltimoIntento).toBeFalse();
  });

  it('shows a rewarded ad before revealing a hint at any regular difficulty', async () => {
    fixture.componentInstance.nivel = 'facil';
    admob.showRewardedVideo.and.resolveTo(true);
    expect(await fixture.componentInstance['verAnuncioYPedirPista']()).toBeTrue();

    expect(admob.showInterstitial).not.toHaveBeenCalled();
    expect(admob.showRewardedVideo).toHaveBeenCalledTimes(1);
    expect(game.usarPista).toHaveBeenCalledTimes(1);
  });

  it('requires a result action instead of dismissing the alert by tapping outside', async () => {
    gameStates.next({
      secretWord: 'CASA',
      lettersGuessed: new Set<string>(),
      lettersFailed: new Set<string>(),
      attemptsRemaining: 0,
      gameOver: true,
      winner: false,
      score: 0,
      streak: 0
    });

    await fixture.whenStable();
    expect(alert.create).toHaveBeenCalled();
    expect(alert.create.calls.mostRecent().args[0]?.backdropDismiss).toBeFalse();
    expect(alert.create.calls.mostRecent().args[0]?.message).toContain('Puntuación: 0');
    expect(alert.create.calls.mostRecent().args[0]?.message).toContain('Racha: 0');
  });

  it('shows score and streak after a won level', async () => {
    gameStates.next({
      secretWord: 'CASA',
      lettersGuessed: new Set(['C', 'A', 'S']),
      lettersFailed: new Set<string>(),
      attemptsRemaining: 7,
      gameOver: true,
      winner: true,
      score: 70,
      streak: 2
    });

    await fixture.whenStable();
    expect(alert.create.calls.mostRecent().args[0]?.message).toContain('Puntuación: 70');
    expect(alert.create.calls.mostRecent().args[0]?.message).toContain('Racha: 2');
  });

  it('offers a rewarded retry only for a lost daily challenge and restarts after the reward', async () => {
    fixture.componentInstance.nivel = 'diario';
    platform.is.and.returnValue(true);
    admob.showRewardedVideo.and.resolveTo(true);
    gameStates.next({
      secretWord: 'GATO',
      lettersGuessed: new Set<string>(),
      lettersFailed: new Set<string>(),
      attemptsRemaining: 0,
      gameOver: true,
      winner: false,
      score: 0,
      streak: 0
    });

    await fixture.whenStable();
    const buttons = alert.create.calls.mostRecent().args[0]?.buttons ?? [];
    expect(buttons.some(button => typeof button !== 'string' && button.text === 'Ver anuncio y reintentar')).toBeTrue();
    expect(await fixture.componentInstance['solicitarReintento']()).toBeTrue();
    expect(admob.showRewardedVideo).toHaveBeenCalledTimes(1);
    expect(game.reintentarRetoDiario).toHaveBeenCalledTimes(1);
  });

  it('keeps the daily result open if the ad is closed without a reward', async () => {
    fixture.componentInstance.nivel = 'diario';
    admob.showRewardedVideo.and.resolveTo(false);
    gameStates.next({
      secretWord: 'GATO',
      lettersGuessed: new Set<string>(),
      lettersFailed: new Set<string>(),
      attemptsRemaining: 0,
      gameOver: true,
      winner: false,
      score: 0,
      streak: 0
    });

    expect(await fixture.componentInstance['solicitarReintento']()).toBeFalse();
    expect(game.reintentarRetoDiario).not.toHaveBeenCalled();
    expect(toast.create).toHaveBeenCalled();
  });

  for (const nivel of ['facil', 'normal', 'avanzado'] as Level[]) {
    it(`grants a ${nivel} retry with one rewarded ad and skips the pending interstitial`, async () => {
      const component = fixture.componentInstance;
      component.nivel = nivel;
      platform.is.and.returnValue(true);
      stats.consumeDailyGamesInterstitial.and.returnValue(true);
      admob.showRewardedVideo.and.resolveTo(true);
      gameStates.next({
        secretWord: 'GATO', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
        attemptsRemaining: 0, gameOver: true, winner: false, score: 0, streak: 0
      });
      await fixture.whenStable();
      game.iniciarNuevoJuego.calls.reset();

      expect(await component['solicitarReintento']()).toBeTrue();

      expect(game.iniciarNuevoJuego).toHaveBeenCalledOnceWith('general', nivel);
      expect(admob.showRewardedVideo).toHaveBeenCalledTimes(1);
      expect(admob.showInterstitial).not.toHaveBeenCalled();
      expect(stats.consumeDailyGamesInterstitial).not.toHaveBeenCalled();
    });
  }

  for (const nivel of ['diario', 'contrarreloj'] as Level[]) {
    it(`skips the pending interstitial when ${nivel} offers a retry`, async () => {
      const component = fixture.componentInstance;
      component.nivel = nivel;
      component.isTimeTrial = nivel === 'contrarreloj';
      component['timeTrialAttemptStarted'] = component.isTimeTrial;
      platform.is.and.returnValue(true);
      stats.consumeDailyGamesInterstitial.and.returnValue(true);
      gameStates.next({
        secretWord: 'GATO', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
        attemptsRemaining: 0, gameOver: true, winner: false, score: 0, streak: 0
      });
      await fixture.whenStable();

      expect(stats.consumeDailyGamesInterstitial).not.toHaveBeenCalled();
      expect(admob.showInterstitial).not.toHaveBeenCalled();
      expect(alert.create.calls.mostRecent().args[0]?.buttons?.length).toBe(2);
    });
  }

  it('keeps the pending interstitial when a daily retry has already been used', async () => {
    fixture.componentInstance.nivel = 'diario';
    platform.is.and.returnValue(true);
    stats.isDailyRetryAvailable.and.returnValue(false);
    stats.consumeDailyGamesInterstitial.and.returnValue(true);
    gameStates.next({
      secretWord: 'GATO', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 0, gameOver: true, winner: false, score: 0, streak: 0
    });
    await fixture.whenStable();

    expect(admob.showInterstitial).toHaveBeenCalledTimes(1);
  });

  it('does not add an interstitial when a rewarded hint completes the daily word', async () => {
    fixture.componentInstance.nivel = 'diario';
    stats.consumeDailyGamesInterstitial.and.returnValue(true);
    admob.showRewardedVideo.and.resolveTo(true);
    game.usarPista.and.callFake(() => {
      gameStates.next({
        secretWord: 'GATO', lettersGuessed: new Set(['G', 'A', 'T', 'O']), lettersFailed: new Set<string>(),
        attemptsRemaining: 7, gameOver: true, winner: true, score: 70, streak: 1
      });
      return true;
    });

    expect(await fixture.componentInstance['verAnuncioYPedirPista']()).toBeTrue();
    await fixture.whenStable();

    expect(admob.showInterstitial).not.toHaveBeenCalled();
    expect(stats.consumeDailyGamesInterstitial).not.toHaveBeenCalled();
  });

  it('requires a rewarded ad for each time trial retry', async () => {
    const component = fixture.componentInstance;
    component.isTimeTrial = true;
    component.nivel = 'contrarreloj';
    component['timeTrialAttemptStarted'] = true;
    admob.showRewardedVideo.and.resolveTo(true);
    gameStates.next({
      secretWord: 'GATO', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 0, gameOver: true, winner: false, score: 0, streak: 0
    });

    expect(await component['solicitarReintento']()).toBeTrue();
    expect(admob.showRewardedVideo).toHaveBeenCalledTimes(1);
    expect(stats.unlockTimeTrialRetry).toHaveBeenCalledTimes(1);
    expect(stats.startTimeTrialAttempt).toHaveBeenCalledTimes(1);
    expect(game.iniciarContrarreloj).toHaveBeenCalledWith(1);

    stats.getTimeTrialRetriesUnlocked.and.returnValue(1);
    stats.getTimeTrialAttempts.and.returnValue(2);
    gameStates.next({
      secretWord: 'GATO', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 0, gameOver: true, winner: false, score: 0, streak: 0
    });
    expect(await component['solicitarReintento']()).toBeTrue();
    expect(admob.showRewardedVideo).toHaveBeenCalledTimes(2);
    expect(stats.unlockTimeTrialRetry).toHaveBeenCalledTimes(2);
    expect(stats.startTimeTrialAttempt).toHaveBeenCalledTimes(2);
  });

  it('starts the countdown only when the time trial view is visible and pauses while hidden', fakeAsync(() => {
    let visibility: DocumentVisibilityState = 'visible';
    spyOnProperty(document, 'visibilityState', 'get').and.callFake(() => visibility);
    const component = fixture.componentInstance;
    component.isTimeTrial = true;
    component.remainingSeconds = 3;
    component['timeTrialAttemptStarted'] = true;
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 7, gameOver: false, winner: false, score: 0, streak: 0
    });

    tick(1000);
    expect(component.remainingSeconds).toBe(3);
    component.ionViewDidEnter();
    tick(1000);
    expect(component.remainingSeconds).toBe(2);

    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    tick(3000);
    expect(component.remainingSeconds).toBe(2);

    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    tick(2000);
    expect(game.finalizarPorTiempo).toHaveBeenCalledTimes(1);
    expect(component.remainingSeconds).toBe(0);
    component.ionViewWillLeave();
  }));

  it('does not start a timer or process a result without an admitted time trial attempt', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.isTimeTrial = true;
    component.remainingSeconds = 20;
    component.ionViewDidEnter();
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 0, gameOver: true, winner: false, lossReason: 'time', score: 0, streak: 0
    });

    tick(2000);
    expect(component.remainingSeconds).toBe(20);
    expect(game.finalizarPorTiempo).not.toHaveBeenCalled();
    expect(stats.completeTimeTrial).not.toHaveBeenCalled();
    expect(alert.create).not.toHaveBeenCalled();
    component.ionViewWillLeave();
  }));

  it('waits for the rewarded ad to finish before starting another time trial', async () => {
    const component = fixture.componentInstance;
    component.isTimeTrial = true;
    component.nivel = 'contrarreloj';
    component['timeTrialAttemptStarted'] = true;
    let finishAd!: (rewarded: boolean) => void;
    admob.showRewardedVideo.and.returnValue(new Promise(resolve => { finishAd = resolve; }));
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 0, gameOver: true, winner: false, lossReason: 'attempts', score: 0, streak: 0
    });

    const retry = component['solicitarReintento']();
    expect(game.iniciarContrarreloj).not.toHaveBeenCalled();
    finishAd(true);
    expect(await retry).toBeTrue();
    expect(game.iniciarContrarreloj).toHaveBeenCalledOnceWith(1);
  });

  for (const nivel of ['facil', 'normal', 'avanzado'] as Level[]) {
    it(`skips the pending daily interstitial after winning at ${nivel} difficulty`, async () => {
      fixture.componentInstance.nivel = nivel;
      stats.consumeDailyGamesInterstitial.and.returnValue(true);
      gameStates.next({
        secretWord: 'CASA', lettersGuessed: new Set(['C', 'A', 'S']), lettersFailed: new Set<string>(),
        attemptsRemaining: 7, gameOver: true, winner: true, score: 100, streak: 1
      });

      await fixture.whenStable();

      expect(stats.consumeDailyGamesInterstitial).not.toHaveBeenCalled();
      expect(admob.showInterstitial).not.toHaveBeenCalled();
      expect(admob.showRewardedVideo).not.toHaveBeenCalled();
      expect(alert.create.calls.mostRecent().args[0]?.cssClass).toBe('game-result-alert game-result-alert-won');
    });
  }

  for (const scenario of [
    { nivel: 'normal', winner: false },
    { nivel: 'diario', winner: true }
  ] as { nivel: Level; winner: boolean }[]) {
    it(`keeps the pending daily interstitial for ${scenario.nivel} with winner=${scenario.winner}`, async () => {
      const component = fixture.componentInstance;
      component.nivel = scenario.nivel;
      component.isTimeTrial = scenario.nivel === 'contrarreloj';
      component.timeTrialLevel = component.timeTrialTimes.length;
      stats.consumeDailyGamesInterstitial.and.returnValue(true);
      gameStates.next({
        secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
        attemptsRemaining: scenario.winner ? 7 : 0, gameOver: true, winner: scenario.winner, score: 0, streak: 0
      });

      await fixture.whenStable();

      expect(admob.showInterstitial).toHaveBeenCalledTimes(1);
      expect(alert.create).toHaveBeenCalledTimes(1);
    });
  }

  it('shows the time trial result without an interstitial and states the loss reason', async () => {
    const component = fixture.componentInstance;
    component.nivel = 'contrarreloj';
    component.isTimeTrial = true;
    component['timeTrialAttemptStarted'] = true;
    stats.getTimeTrialRetriesRemaining.and.returnValue(0);
    stats.consumeDailyGamesInterstitial.and.returnValue(true);
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set(['B']),
      attemptsRemaining: 6, gameOver: true, winner: false, lossReason: 'time', score: 0, streak: 0
    });

    await fixture.whenStable();

    expect(admob.showInterstitial).not.toHaveBeenCalled();
    expect(stats.consumeDailyGamesInterstitial).not.toHaveBeenCalled();
    expect(alert.create.calls.mostRecent().args[0]?.header).toBe('Tiempo agotado');
    expect(alert.create.calls.mostRecent().args[0]?.message).toContain('Se ha agotado el tiempo.');
    expect(component.fallos).toBe(1);
  });

  it('shows the final time trial win without an interstitial', async () => {
    const component = fixture.componentInstance;
    component.nivel = 'contrarreloj';
    component.isTimeTrial = true;
    component['timeTrialAttemptStarted'] = true;
    component.timeTrialLevel = component.timeTrialTimes.length;
    stats.consumeDailyGamesInterstitial.and.returnValue(true);
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set(['C', 'A', 'S']), lettersFailed: new Set<string>(),
      attemptsRemaining: 7, gameOver: true, winner: true, score: 70, streak: 1
    });

    await fixture.whenStable();

    expect(admob.showInterstitial).not.toHaveBeenCalled();
    expect(stats.consumeDailyGamesInterstitial).not.toHaveBeenCalled();
    expect(alert.create.calls.mostRecent().args[0]?.header).toBe('¡Contrarreloj superado!');
  });

  it('starts another word without showing an ad after winning', async () => {
    game.iniciarNuevoJuego.calls.reset();

    await fixture.componentInstance.jugarDeNuevo();

    expect(game.iniciarNuevoJuego).toHaveBeenCalledWith('general', 'normal');
    expect(admob.showInterstitial).not.toHaveBeenCalled();
    expect(admob.showRewardedVideo).not.toHaveBeenCalled();
  });
});
