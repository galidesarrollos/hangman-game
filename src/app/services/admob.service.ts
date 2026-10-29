import { Injectable } from '@angular/core';
import { AdMob, AdmobConsentInfo, AdmobConsentStatus, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AdmobService {
  private readonly bannerId = 'ca-app-pub-6536506161156686/1504061076';
  private readonly interstitialId = 'ca-app-pub-6536506161156686/6321451098';
  private initialization?: Promise<void>;
  private consentRequest?: Promise<AdmobConsentInfo | null>;
  private consentPending = false;
  private consentRetryAfter = Number.POSITIVE_INFINITY;
  private latestConsentInfo: AdmobConsentInfo | null = null;
  privacyOptionsRequired = false;
  rewardedFailure: 'consent' | 'unavailable' | 'dismissed' | null = null;
  private privacyOptionsOpen = false;
  private bannerRequest?: Promise<void>;
  private bannerVisible = false;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryDelay = 60000;

  async initialize(showConsentForm = true): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || this.privacyOptionsOpen) return false;
    let consent = await this.requestConsent(showConsentForm);
    if (showConsentForm && consent?.status === AdmobConsentStatus.REQUIRED &&
        consent.isConsentFormAvailable && !consent.canRequestAds) {
      // A banner may have started the shared request without presenting the form.
      this.consentRequest = undefined;
      consent = await this.requestConsent(true);
    }
    if (!consent?.canRequestAds) return false;
    await this.initializeSdk();
    return true;
  }

  private requestConsent(showForm = true): Promise<AdmobConsentInfo | null> {
    if (!this.consentPending && (Date.now() >= this.consentRetryAfter ||
        (showForm && this.latestConsentInfo?.status === AdmobConsentStatus.REQUIRED &&
         this.latestConsentInfo.isConsentFormAvailable && !this.latestConsentInfo.canRequestAds))) this.consentRequest = undefined;
    if (!this.consentRequest) {
      this.consentPending = true;
      this.consentRetryAfter = Number.POSITIVE_INFINITY;
      this.consentRequest = (async () => {
        try {
          let info = await AdMob.requestConsentInfo();
          if (showForm && info.status === AdmobConsentStatus.REQUIRED && info.isConsentFormAvailable) {
            // La versión 7.2 del plugin necesita inicializar AdMob para presentar formularios en iOS.
            if (Capacitor.getPlatform() === 'ios') await this.initializeSdk();
            info = await AdMob.showConsentForm();
          }
          this.privacyOptionsRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
          this.latestConsentInfo = info;
          if (!info.canRequestAds) {
            this.consentRetryAfter = Date.now() + 60000;
            console.warn('AdMob no puede solicitar anuncios:', { status: info.status, formAvailable: info.isConsentFormAvailable });
          }
          return info;
        } catch (error) {
          console.warn('No se ha podido obtener el consentimiento publicitario:', error);
          this.latestConsentInfo = null;
          this.consentRetryAfter = Date.now() + 60000;
          return null;
        } finally {
          this.consentPending = false;
        }
      })();
    }
    return this.consentRequest;
  }

  private initializeSdk(): Promise<void> {
    if (!this.initialization) {
      this.initialization = (async () => {
        await AdMob.initialize();
        await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          this.bannerVisible = true;
          this.retryDelay = 60000;
          this.clearRetry();
        });
        await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, error => {
          console.warn('El banner de AdMob no se ha cargado:', error);
          this.bannerVisible = false;
          this.scheduleRetry();
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && !this.bannerVisible) {
            void this.showBannerBottomCenter();
          }
        });
      })().catch(error => {
        this.initialization = undefined;
        throw error;
      });
    }
    return this.initialization;
  }

  async showPrivacyOptions(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.privacyOptionsRequired || this.privacyOptionsOpen) return;
    this.privacyOptionsOpen = true;
    try {
      this.clearRetry();
      if (this.bannerRequest) await this.bannerRequest;
      if (this.bannerVisible) {
        await AdMob.removeBanner();
        this.bannerVisible = false;
      }
      if (Capacitor.getPlatform() === 'ios') await this.initializeSdk();
      await AdMob.showPrivacyOptionsForm();
    } finally {
      this.consentRequest = undefined;
      this.consentRetryAfter = Number.POSITIVE_INFINITY;
      const consent = await this.requestConsent(false);
      this.privacyOptionsOpen = false;
      if (consent?.canRequestAds) await this.showBannerBottomCenter();
    }
  }

  showBannerBottomCenter(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.bannerVisible || this.privacyOptionsOpen) return Promise.resolve();
    if (!this.bannerRequest) {
      this.bannerRequest = (async () => {
        try {
          if (!await this.initialize(false)) {
            if (!this.latestConsentInfo || this.latestConsentInfo.status === AdmobConsentStatus.REQUIRED ||
                this.latestConsentInfo.status === AdmobConsentStatus.UNKNOWN) this.scheduleRetry();
            return;
          }
          if (this.privacyOptionsOpen) return;
          if (this.bannerVisible) return;
          this.clearRetry();
          this.bannerVisible = true;
          await AdMob.showBanner({
            adId: this.bannerId,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            isTesting: false
          });
        } catch (error) {
          this.bannerVisible = false;
          console.error('Error al mostrar el banner de AdMob:', error);
          this.scheduleRetry();
        }
      })().finally(() => { this.bannerRequest = undefined; });
    }
    return this.bannerRequest;
  }

  private scheduleRetry(): void {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      if (document.visibilityState === 'visible') void this.showBannerBottomCenter();
      else this.scheduleRetry();
    }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 300000);
  }

  private clearRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  async showInterstitial(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const listeners: PluginListenerHandle[] = [];
    let finish: () => void = () => undefined;
    const dismissed = new Promise<void>(resolve => { finish = resolve; });
    try {
      if (!await this.initialize(false)) return;
      listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finish));
      listeners.push(await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finish));
      await AdMob.prepareInterstitial({
        adId: this.interstitialId,
        isTesting: false,
      });
      await AdMob.showInterstitial();
      await dismissed;
    } finally {
      for (const listener of listeners) await listener.remove();
    }
  }

  async showRewardedVideo(): Promise<boolean> {
    this.rewardedFailure = 'unavailable';
    if (!Capacitor.isNativePlatform()) return false;

    const adId = Capacitor.getPlatform() === 'ios'
      ? environment.rewardedIosAdUnitId
      : environment.rewardedAndroidAdUnitId;
    const listeners: PluginListenerHandle[] = [];
    let rewardEarned = false;
    let finish: (earned: boolean) => void = () => undefined;
    const outcome = new Promise<boolean>(resolve => { finish = resolve; });

    try {
      if (!await this.initialize()) {
        this.rewardedFailure = 'consent';
        return false;
      }
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, reward => {
        rewardEarned ||= reward.amount > 0;
      }));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, error => {
        console.warn('El anuncio recompensado no se ha cargado:', { code: error.code, message: error.message });
      }));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        this.rewardedFailure = rewardEarned ? null : 'dismissed';
        finish(rewardEarned);
      }));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(false)));

      await AdMob.prepareRewardVideoAd({ adId, isTesting: false });
      void AdMob.showRewardVideoAd().then(
        reward => { rewardEarned ||= reward.amount > 0; },
        error => {
          console.warn('No se ha podido mostrar el anuncio recompensado:', error);
          if (!rewardEarned) finish(false);
        }
      );
      return await outcome;
    } catch (error) {
      console.warn('No se ha podido cargar el anuncio recompensado:', error);
      return rewardEarned;
    } finally {
      for (const listener of listeners) {
        try {
          await listener.remove();
        } catch (error) {
          console.warn('No se ha podido retirar un listener del anuncio recompensado:', error);
        }
      }
    }
  }

}
