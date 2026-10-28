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
  const stats = jasmine.createSpyObj('StatsService', ['getStats', 'getTimeTrialAttempts', 'getTimeTrialResult', 'areTimeTrialRetriesUnlocked', 'unlockTimeTrialRetries']);
  const platform = jasmine.createSpyObj<Platform>('Platform', ['is']);
  const admob = jasmine.createSpyObj<AdmobService>('AdmobService', ['showBannerBottomCenter', 'showRewardedVideo']);

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    stats.getStats.and.returnValue({ gamesPlayed: 2, wins: 1, losses: 1, bestStreak: 1 });
    stats.getTimeTrialAttempts.and.returnValue(0);
    stats.getTimeTrialResult.and.returnValue(null);
    stats.areTimeTrialRetriesUnlocked.and.returnValue(false);
    platform.is.and.returnValue(false);
    admob.showRewardedVideo.calls.reset();
    await TestBed.configureTestingModule({
      imports: [StartComponent, IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: router },
        { provide: ModalController, useValue: {} },
        { provide: IonRouterOutlet, useValue: { nativeEl: document.createElement('div') } },
        { provide: AdmobService, useValue: admob },
        { provide: Platform, useValue: platform },
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

  it('shows the time trial when no attempt has been used today', async () => {
    const component = fixture.componentInstance;
    await component.ionViewWillEnter();
    expect(component.timeTrialAvailable).toBeTrue();
    component.startTimeTrial();
    expect(router.navigate).toHaveBeenCalledWith(['/contrarreloj']);
  });

  it('disables the time trial after an attempt has been used', async () => {
    stats.getTimeTrialAttempts.and.returnValue(1);
    stats.getTimeTrialResult.and.returnValue('lost');

    await fixture.componentInstance.ionViewWillEnter();

    expect(fixture.componentInstance.timeTrialAvailable).toBeFalse();
    expect(fixture.componentInstance.timeTrialResult).toBe('lost');
  });

  it('lets the player use unlocked time trial retries from the start screen', async () => {
    stats.getTimeTrialAttempts.and.returnValue(1);
    stats.getTimeTrialResult.and.returnValue('lost');
    stats.areTimeTrialRetriesUnlocked.and.returnValue(true);

    await fixture.componentInstance.ionViewWillEnter();
    expect(fixture.componentInstance.timeTrialAvailable).toBeTrue();
    expect(fixture.componentInstance.timeTrialNeedsAd).toBeFalse();
    await fixture.componentInstance.startTimeTrial();
    expect(router.navigate).toHaveBeenCalledWith(['/contrarreloj']);
    expect(admob.showRewardedVideo).not.toHaveBeenCalled();
  });

  it('offers one rewarded ad to unlock time trial retries from the start screen', async () => {
    stats.getTimeTrialAttempts.and.returnValue(1);
    stats.getTimeTrialResult.and.returnValue('lost');
    platform.is.and.returnValue(true);
    admob.showRewardedVideo.and.resolveTo(true);

    await fixture.componentInstance.ionViewWillEnter();
    expect(fixture.componentInstance.timeTrialNeedsAd).toBeTrue();
    await fixture.componentInstance.startTimeTrial();
    expect(admob.showRewardedVideo).toHaveBeenCalledTimes(1);
    expect(stats.unlockTimeTrialRetries).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/contrarreloj']);
  });

  it('disables the time trial after all three attempts are used', async () => {
    stats.getTimeTrialAttempts.and.returnValue(3);
    stats.getTimeTrialResult.and.returnValue('lost');
    stats.areTimeTrialRetriesUnlocked.and.returnValue(true);

    await fixture.componentInstance.ionViewWillEnter();
    expect(fixture.componentInstance.timeTrialAvailable).toBeFalse();
  });
});
