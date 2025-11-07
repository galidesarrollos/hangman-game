import { Injectable } from '@angular/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

@Injectable({ providedIn: 'root' })
export class AdmobService {
  // Estos son los ID de cada tipo de anuncio
  // private bannerId = 'ca-app-pub-6536506161156686/1504061076';
  // private interstitialId = 'ca-app-pub-6536506161156686/6321451098';
  // private rewardedId = 'ca-app-pub-3940256099942544/5224354917';
  private bannerId = 'ca-app-pub-6536506161156686/1504061076';
  private interstitialId = 'ca-app-pub-6536506161156686/6321451098';

  async initialize() {
    await AdMob.initialize();
  }

  async showBannerTopCenter() {
    await AdMob.showBanner({
      adId: this.bannerId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.TOP_CENTER,
      isTesting: true, // ⚠️ cambia a false en producción
    });
  }
  async showBannerBottomCenter() {
    await AdMob.showBanner({
      adId: this.bannerId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: true, // ⚠️ cambia a false en producción
    });
  }

  async hideBanner() {
    await AdMob.hideBanner();
  }

  async showInterstitial() {
    await AdMob.prepareInterstitial({
      adId: this.interstitialId,
      isTesting: true,
    });
    await AdMob.showInterstitial();
  }

  // async showRewarded() {
  //   await AdMob.prepareRewardVideoAd({
  //     adId: this.rewardedId,
  //     isTesting: true,
  //   });
  //   await AdMob.showRewardVideoAd();
  // }

}
