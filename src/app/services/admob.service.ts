import { Injectable } from '@angular/core';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AdmobService {
  private readonly bannerId = 'ca-app-pub-6536506161156686/1504061076';
  private readonly interstitialId = 'ca-app-pub-6536506161156686/6321451098';
  private initialization?: Promise<void>;
  private bannerRequest?: Promise<void>;
  private bannerVisible = false;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryDelay = 60000;

  initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return Promise.resolve();
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

  showBannerBottomCenter(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.bannerVisible) return Promise.resolve();
    if (!this.bannerRequest) {
      this.bannerRequest = (async () => {
        try {
          await this.initialize();
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

  async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.bannerVisible) return;
    this.clearRetry();
    await AdMob.hideBanner();
    this.bannerVisible = false;
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

  async showInterstitial() {
    await AdMob.prepareInterstitial({
      adId: this.interstitialId,
      isTesting: false,
    });
    await AdMob.showInterstitial();
  }

  async showRewardedVideo(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    const adId = Capacitor.getPlatform() === 'ios'
      ? environment.rewardedIosAdUnitId
      : environment.rewardedAndroidAdUnitId;
    const listeners: PluginListenerHandle[] = [];
    let finish: (earned: boolean) => void = () => undefined;
    const outcome = new Promise<boolean>(resolve => { finish = resolve; });

    try {
      await this.initialize();
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, reward => finish(reward.amount > 0)));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => finish(false)));
      listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => finish(false)));

      await AdMob.prepareRewardVideoAd({ adId, isTesting: false });
      void AdMob.showRewardVideoAd().then(
        reward => finish(reward.amount > 0),
        error => {
          console.warn('No se ha podido mostrar el anuncio recompensado:', error);
          finish(false);
        }
      );
      return await outcome;
    } catch (error) {
      console.warn('No se ha podido cargar el anuncio recompensado:', error);
      return false;
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
