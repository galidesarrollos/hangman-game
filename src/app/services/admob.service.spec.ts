import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { AdMobWeb } from '@capacitor-community/admob/dist/esm/web';
import { Capacitor } from '@capacitor/core';
import { AdmobService } from './admob.service';

describe('AdmobService rewarded ads', () => {
  let service: AdmobService;
  let addListener: jasmine.Spy;
  let remove: jasmine.Spy;
  let prepare: jasmine.Spy;
  let show: jasmine.Spy;

  beforeEach(async () => {
    spyOn(AdMobWeb.prototype, 'initialize').and.resolveTo();
    // Load Capacitor's web implementation before entering fakeAsync tests.
    await AdMob.initialize();
    service = new AdmobService();
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    spyOn(service, 'initialize').and.resolveTo();
    remove = jasmine.createSpy('remove').and.resolveTo();
    addListener = spyOn(AdMobWeb.prototype, 'addListener').and.resolveTo({ remove });
    prepare = spyOn(AdMobWeb.prototype, 'prepareRewardVideoAd').and.resolveTo({ adUnitId: 'test' });
    show = spyOn(AdMobWeb.prototype, 'showRewardVideoAd').and.returnValue(new Promise(() => undefined));
  });

  function emit(event: RewardAdPluginEvents, amount = 1): void {
    const callback = addListener.calls.allArgs().find(args => args[0] === event)?.[1];
    expect(callback).toBeDefined();
    callback({ amount, type: 'reward' });
    flushMicrotasks();
  }

  it('waits for dismissal after earning a reward and removes the listeners', fakeAsync(() => {
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    emit(RewardAdPluginEvents.Rewarded);
    expect(result).toBeUndefined();
    expect(remove).not.toHaveBeenCalled();

    emit(RewardAdPluginEvents.Dismissed);
    expect(result).toBeTrue();
    expect(remove).toHaveBeenCalledTimes(3);
    expect(show).toHaveBeenCalledTimes(1);
  }));

  it('also waits for dismissal when the show promise supplies the reward', fakeAsync(() => {
    show.and.resolveTo({ amount: 1, type: 'reward' });
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();
    expect(result).toBeUndefined();

    emit(RewardAdPluginEvents.Dismissed);
    expect(result).toBeTrue();
  }));

  it('does not grant a reward when dismissed early', fakeAsync(() => {
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    emit(RewardAdPluginEvents.Dismissed);
    expect(result).toBeFalse();
    expect(remove).toHaveBeenCalledTimes(3);
  }));

  it('handles a failure to show without granting a reward', fakeAsync(() => {
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    emit(RewardAdPluginEvents.FailedToShow);
    expect(result).toBeFalse();
    expect(remove).toHaveBeenCalledTimes(3);
  }));

  it('keeps an earned reward if the show promise subsequently rejects', fakeAsync(() => {
    let rejectShow!: (reason: Error) => void;
    show.and.returnValue(new Promise((_, reject) => { rejectShow = reject; }));
    spyOn(console, 'warn');
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    emit(RewardAdPluginEvents.Rewarded);
    rejectShow(new Error('Late SDK error'));
    flushMicrotasks();
    expect(result).toBeTrue();
    expect(remove).toHaveBeenCalledTimes(3);
  }));

  it('cleans up after a loading error', fakeAsync(() => {
    prepare.and.rejectWith(new Error('No ad available'));
    spyOn(console, 'warn');
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    expect(result).toBeFalse();
    expect(show).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(3);
  }));
});
