import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { AdMob, AdmobConsentInfo, AdmobConsentStatus, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
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
    spyOn(service, 'initialize').and.resolveTo(true);
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
    expect(remove).toHaveBeenCalledTimes(4);
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
    expect(service.rewardedFailure).toBe('dismissed');
    expect(remove).toHaveBeenCalledTimes(4);
  }));

  it('handles a failure to show without granting a reward', fakeAsync(() => {
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    emit(RewardAdPluginEvents.FailedToShow);
    expect(result).toBeFalse();
    expect(remove).toHaveBeenCalledTimes(4);
  }));

  it('waits for dismissal even if the show promise rejects after earning a reward', fakeAsync(() => {
    let rejectShow!: (reason: Error) => void;
    show.and.returnValue(new Promise((_, reject) => { rejectShow = reject; }));
    spyOn(console, 'warn');
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    emit(RewardAdPluginEvents.Rewarded);
    rejectShow(new Error('Late SDK error'));
    flushMicrotasks();
    expect(result).toBeUndefined();
    emit(RewardAdPluginEvents.Dismissed);
    expect(result).toBeTrue();
    expect(remove).toHaveBeenCalledTimes(4);
  }));

  it('cleans up after a loading error', fakeAsync(() => {
    prepare.and.rejectWith(new Error('No ad available'));
    spyOn(console, 'warn');
    let result: boolean | undefined;
    service.showRewardedVideo().then(value => { result = value; });
    flushMicrotasks();

    expect(result).toBeFalse();
    expect(service.rewardedFailure).toBe('unavailable');
    expect(show).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(4);
  }));

  it('waits until an interstitial is dismissed before continuing to the game', fakeAsync(() => {
    spyOn(AdMobWeb.prototype, 'prepareInterstitial').and.resolveTo({ adUnitId: 'test' });
    const showInterstitial = spyOn(AdMobWeb.prototype, 'showInterstitial').and.resolveTo();
    let finished = false;

    service.showInterstitial().then(() => { finished = true; });
    flushMicrotasks();
    expect(showInterstitial).toHaveBeenCalledTimes(1);
    expect(finished).toBeFalse();

    const onDismissed = addListener.calls.allArgs().find(args => args[0] === InterstitialAdPluginEvents.Dismissed)?.[1];
    expect(onDismissed).toBeDefined();
    onDismissed();
    flushMicrotasks();
    expect(finished).toBeTrue();
    expect(remove).toHaveBeenCalledTimes(2);
  }));
});

describe('AdmobService consent', () => {
  let service: AdmobService;
  let requestConsentInfo: jasmine.Spy;
  let showConsentForm: jasmine.Spy;
  let initializeSdk: jasmine.Spy;

  const required: AdmobConsentInfo = {
    status: AdmobConsentStatus.REQUIRED,
    isConsentFormAvailable: true,
    canRequestAds: false,
    privacyOptionsRequirementStatus: 'REQUIRED' as AdmobConsentInfo['privacyOptionsRequirementStatus']
  };
  const obtained: AdmobConsentInfo = {
    status: AdmobConsentStatus.OBTAINED,
    canRequestAds: true,
    privacyOptionsRequirementStatus: 'REQUIRED' as AdmobConsentInfo['privacyOptionsRequirementStatus']
  };

  beforeEach(async () => {
    spyOn(AdMobWeb.prototype, 'initialize').and.resolveTo();
    await AdMob.initialize();
    service = new AdmobService();
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    initializeSdk = AdMobWeb.prototype.initialize as jasmine.Spy;
    initializeSdk.calls.reset();
    spyOn(AdMobWeb.prototype, 'addListener').and.resolveTo({ remove: () => Promise.resolve() });
    requestConsentInfo = spyOn(AdMobWeb.prototype, 'requestConsentInfo').and.resolveTo(required);
    showConsentForm = spyOn(AdMobWeb.prototype, 'showConsentForm').and.resolveTo(obtained);
  });

  it('waits for consent before initializing the ads SDK', async () => {
    let finishForm!: (value: AdmobConsentInfo) => void;
    showConsentForm.and.returnValue(new Promise(resolve => { finishForm = resolve; }));

    const starting = service.initialize();
    await Promise.resolve();
    expect(initializeSdk).not.toHaveBeenCalled();
    finishForm(obtained);

    expect(await starting).toBeTrue();
    expect(initializeSdk).toHaveBeenCalledTimes(1);
    expect(service.privacyOptionsRequired).toBeTrue();
    expect(requestConsentInfo).toHaveBeenCalledTimes(1);
  });

  it('does not initialize ads when UMP cannot request them', async () => {
    showConsentForm.and.resolveTo({ ...obtained, canRequestAds: false });

    expect(await service.initialize()).toBeFalse();
    expect(initializeSdk).not.toHaveBeenCalled();
  });

  it('rechecks temporary blocked consent after a minute', async () => {
    let now = 0;
    spyOn(Date, 'now').and.callFake(() => now);
    spyOn(console, 'warn');
    requestConsentInfo.and.returnValues(
      Promise.resolve({ ...required, isConsentFormAvailable: false }),
      Promise.resolve(obtained)
    );

    expect(await service.initialize()).toBeFalse();
    expect(requestConsentInfo).toHaveBeenCalledTimes(1);
    now = 60000;
    expect(await service.initialize()).toBeTrue();
    expect(requestConsentInfo).toHaveBeenCalledTimes(2);
  });

  it('does not open a consent form from a background banner retry', async () => {
    spyOn(console, 'warn');
    await service.showBannerBottomCenter();
    service['clearRetry']();

    expect(requestConsentInfo).toHaveBeenCalledTimes(1);
    expect(showConsentForm).not.toHaveBeenCalled();
    expect(initializeSdk).not.toHaveBeenCalled();
  });

  it('presents consent when startup shares a request begun by the banner', async () => {
    spyOn(console, 'warn');

    const banner = service.showBannerBottomCenter();
    const startup = service.initialize();
    await Promise.all([banner, startup]);
    service['clearRetry']();

    expect(requestConsentInfo).toHaveBeenCalledTimes(2);
    expect(showConsentForm).toHaveBeenCalledTimes(1);
    expect(initializeSdk).toHaveBeenCalledTimes(1);
  });

  it('requests consent information before the iOS SDK and then presents the form', async () => {
    (Capacitor.getPlatform as jasmine.Spy).and.returnValue('ios');
    const order: string[] = [];
    requestConsentInfo.and.callFake(async () => { order.push('info'); return required; });
    initializeSdk.and.callFake(async () => { order.push('sdk'); });
    showConsentForm.and.callFake(async () => { order.push('form'); return obtained; });

    expect(await service.initialize()).toBeTrue();
    expect(order).toEqual(['info', 'sdk', 'form']);
  });

  it('refreshes consent after privacy options are changed', async () => {
    const removeBanner = spyOn(AdMobWeb.prototype, 'removeBanner').and.resolveTo();
    const showBanner = spyOn(AdMobWeb.prototype, 'showBanner').and.resolveTo();
    const showPrivacyOptionsForm = spyOn(AdMobWeb.prototype, 'showPrivacyOptionsForm').and.resolveTo();
    requestConsentInfo.and.returnValues(Promise.resolve(obtained), Promise.resolve({ ...obtained, canRequestAds: false }));

    await service.showBannerBottomCenter();
    expect(showBanner).toHaveBeenCalledTimes(1);
    await service.showPrivacyOptions();

    expect(showPrivacyOptionsForm).toHaveBeenCalledTimes(1);
    expect(removeBanner).toHaveBeenCalledTimes(1);
    expect(requestConsentInfo).toHaveBeenCalledTimes(2);
    expect(showBanner).toHaveBeenCalledTimes(1);
  });

  it('removes the banner while a native ad occupies the home screen and restores it afterward', async () => {
    const showBanner = spyOn(AdMobWeb.prototype, 'showBanner').and.resolveTo();
    const removeBanner = spyOn(AdMobWeb.prototype, 'removeBanner').and.resolveTo();
    requestConsentInfo.and.resolveTo(obtained);

    await service.showBannerBottomCenter();
    await service.hideBannerForNativeAd();
    await service.showBannerBottomCenter();
    expect(showBanner).toHaveBeenCalledTimes(1);
    expect(removeBanner).toHaveBeenCalledTimes(1);

    await service.restoreBanner();
    expect(showBanner).toHaveBeenCalledTimes(2);
  });
});
