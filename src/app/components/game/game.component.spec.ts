import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, IonRouterOutlet, ModalController } from '@ionic/angular';
import { of } from 'rxjs';
import { AdmobService } from '../../services/admob.service';
import { AudioService } from '../../services/audio.service';
import { GameService } from '../../services/game.service';
import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let fixture: ComponentFixture<GameComponent>;
  const game = { GameState$: of({ secretWord: 'CASA', lettersGuessed: new Set<string>(), lettersFailed: new Set<string>(), attemptsRemaining: 7, gameOver: false, winner: false, score: 0, streak: 0 }), iniciarNuevoJuego: jasmine.createSpy(), obtenerPalabraVisible: () => '_ _ _ _', adivinarLetra: jasmine.createSpy() };

  beforeEach(async () => {
    game.iniciarNuevoJuego.calls.reset();
    await TestBed.configureTestingModule({
      imports: [GameComponent, IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { params: of({ theme: 'general', level: 'normal' }) } },
        { provide: GameService, useValue: game },
        { provide: ModalController, useValue: {} },
        { provide: AlertController, useValue: {} },
        { provide: IonRouterOutlet, useValue: { nativeEl: document.createElement('div') } },
        { provide: AdmobService, useValue: { showInterstitial: jasmine.createSpy() } },
        { provide: AudioService, useValue: { getVolume: () => 1 } }
      ]
    }).overrideComponent(GameComponent, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    fixture.detectChanges();
  });

  it('starts a game using the route theme and level', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(game.iniciarNuevoJuego).toHaveBeenCalledWith('general', 'normal');
  });
});
