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
  const stats = jasmine.createSpyObj('StatsService', ['getStats', 'isDailyAvailable', 'getDailyRemainingMs', 'getDailyResult']);

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    stats.getStats.and.returnValue({ gamesPlayed: 2, wins: 1, losses: 1, bestStreak: 1 });
    stats.isDailyAvailable.and.returnValue(true);
    stats.getDailyRemainingMs.and.returnValue(3600000);
    stats.getDailyResult.and.returnValue(null);
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

  it('routes to theme selection', async () => {
    const component = fixture.componentInstance;
    await component.openThemeSelector();
    expect(router.navigate).toHaveBeenCalledWith(['/tematicas']);
  });

  it('keeps the daily modal closed on entry and opens it from the button', async () => {
    const component = fixture.componentInstance;
    await component.ionViewWillEnter();
    expect(component.retoDiarioDisponible).toBeTrue();
    expect(component.showDailyModal).toBeFalse();

    component.openDailyModal();
    expect(component.showDailyModal).toBeTrue();
  });

  it('reads the saved daily loss on entry', async () => {
    stats.isDailyAvailable.and.returnValue(false);
    stats.getDailyResult.and.returnValue('lost');

    await fixture.componentInstance.ionViewWillEnter();

    expect(fixture.componentInstance.retoDiarioDisponible).toBeFalse();
    expect(fixture.componentInstance.dailyResult).toBe('lost');
  });
});
