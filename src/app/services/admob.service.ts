import { Injectable } from '@angular/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

@Injectable({ providedIn: 'root' })
export class AdmobService {
  private readonly bannerId = 'ca-app-pub-6536506161156686/1504061076';
  private readonly interstitialId = 'ca-app-pub-6536506161156686/6321451098';

  async initialize() {
    await AdMob.initialize();
  }

  async showBannerBottomCenter() {
    await AdMob.showBanner({
      adId: this.bannerId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: false, // ⚠️ cambia a false en producción

    });
  }

  async hideBanner() {
    await AdMob.hideBanner();
  }

  async showInterstitial() {
    await AdMob.prepareInterstitial({
      adId: this.interstitialId,
      isTesting: false,
    });
    await AdMob.showInterstitial();
  }

}
