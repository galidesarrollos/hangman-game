import { inject, Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class WebAdsService {
  private readonly platform = inject(Platform);

  requestAd(): void {
    if (this.platform.is('hybrid')) return;
    try {
      const adsWindow = window as Window & { adsbygoogle?: Record<string, unknown>[] };
      adsWindow.adsbygoogle = adsWindow.adsbygoogle ?? [];
      adsWindow.adsbygoogle.push({});
    } catch (error) {
      console.error('Error cargando AdSense', error);
    }
  }
}
