import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, IonRouterOutlet, ModalController, Platform, ToastController } from '@ionic/angular';
import { of, Subject } from 'rxjs';
import { GameState } from '../../models/game.model';
import { AdmobService } from '../../services/admob.service';
import { AudioService } from '../../services/audio.service';
import { GameService } from '../../services/game.service';
import { StatsService } from '../../services/stats.service';
import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let fixture: ComponentFixture<GameComponent>;
  let gameStates: Subject<GameState>;
  const game = { GameState$: new Subject<GameState>(), iniciarNuevoJuego: jasmine.createSpy(), reintentarRetoDiario: jasmine.createSpy(), usarPista: jasmine.createSpy(), obtenerPalabraVisible: () => '_ _ _ _', adivinarLetra: jasmine.createSpy() };
  const alert = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
  const admob = jasmine.createSpyObj<AdmobService>('AdmobService', ['showBannerBottomCenter', 'showInterstitial', 'showRewardedVideo']);
  const stats = jasmine.createSpyObj<StatsService>('StatsService', ['isDailyRetryAvailable']);
  const platform = jasmine.createSpyObj<Platform>('Platform', ['is']);
  const toast = jasmine.createSpyObj<ToastController>('ToastController', ['create']);
  const audio = jasmine.createSpyObj<AudioService>('AudioService', ['getVolume', 'toggleMute']);

  beforeEach(async () => {
    game.iniciarNuevoJuego.calls.reset();
    game.reintentarRetoDiario.calls.reset();
    game.reintentarRetoDiario.and.returnValue(true);
    admob.showRewardedVideo.calls.reset();
    toast.create.calls.reset();
    toast.create.and.resolveTo({ present: () => Promise.resolve() } as HTMLIonToastElement);
    stats.isDailyRetryAvailable.and.returnValue(true);
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
        { provide: ActivatedRoute, useValue: { params: of({ theme: 'general', level: 'normal' }) } },
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

  it('asks for confirmation before requesting a rewarded hint', async () => {
    gameStates.next({
      secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(),
      attemptsRemaining: 7, gameOver: false, winner: false, score: 0, streak: 0
    });

    await fixture.componentInstance.confirmarPista();
    expect(alert.create.calls.mostRecent().args[0]?.header).toBe('¿Pedir una pista?');
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

  it('waits for the interstitial before starting another game', async () => {
    let finishAd!: () => void;
    admob.showInterstitial.and.returnValue(new Promise<void>(resolve => { finishAd = resolve; }));
    game.iniciarNuevoJuego.calls.reset();

    const replay = fixture.componentInstance.jugarDeNuevo();
    expect(game.iniciarNuevoJuego).not.toHaveBeenCalled();
    finishAd();
    await replay;

    expect(game.iniciarNuevoJuego).toHaveBeenCalledWith('general', 'normal');
  });
});
