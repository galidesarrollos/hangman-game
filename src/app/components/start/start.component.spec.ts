import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IonicModule, IonRouterOutlet, ModalController, Platform } from '@ionic/angular';
import { AdmobService } from '../../services/admob.service';
import { AudioService } from '../../services/audio.service';
import { StatsService } from '../../services/stats.service';
import { StartComponent } from './start.component';

describe('StartComponent', () => {
  let fixture: ComponentFixture<StartComponent>;
  const router = jasmine.createSpyObj('Router', ['navigate']);
  const stats = jasmine.createSpyObj('StatsService', ['getStats', 'isDailyAvailable', 'getDailyRemainingMs', 'resetDaily']);

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    stats.getStats.and.returnValue({ gamesPlayed: 2, wins: 1, losses: 1, bestStreak: 1 });
    stats.isDailyAvailable.and.returnValue(true);
    stats.getDailyRemainingMs.and.returnValue(3600000);
    await TestBed.configureTestingModule({
      imports: [StartComponent, IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: router },
        { provide: ModalController, useValue: {} },
        { provide: IonRouterOutlet, useValue: { nativeEl: document.createElement('div') } },
        { provide: AdmobService, useValue: { showBannerBottomCenter: jasmine.createSpy() } },
        { provide: Platform, useValue: { is: () => false } },
        { provide: AudioService, useValue: { getVolume: () => 1 } },
        { provide: StatsService, useValue: stats }
      ]
    }).overrideComponent(StartComponent, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(StartComponent);
    fixture.detectChanges();
  });

  it('loads saved progress and routes to the chosen theme', () => {
    const component = fixture.componentInstance;
    expect(component.estadisticas.gamesPlayed).toBe(2);
    component.seleccionarTematica('animales');
    expect(router.navigate).toHaveBeenCalledWith(['/level', 'animales']);
  });

  it('resets the daily challenge status when requested', () => {
    fixture.componentInstance.resetDailyChallenge();
    expect(stats.resetDaily).toHaveBeenCalled();
    expect(fixture.componentInstance.retoDiarioDisponible).toBeTrue();
    expect(fixture.componentInstance.showDailyModal).toBeTrue();
  });
});
