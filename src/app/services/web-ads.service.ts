import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { WEB_ADS_CONFIG, WebAdPlacement } from '../config/web-ads.config';

type AdsWindow = Window & {
  adsbygoogle?: { push(value: Record<string, unknown>): unknown };
  googlefc?: {
    callbackQueue: { push(value: Record<string, () => void>): unknown };
    showRevocationMessage?: () => void;
  };
};

@Injectable({ providedIn: 'root' })
export class WebAdsService {
  private readonly document = inject(DOCUMENT);
  private readonly requested = new WeakSet<HTMLElement>();
  readonly client = WEB_ADS_CONFIG.client;

  get enabled(): boolean {
    return environment.production && !environment.adTestMode && !Capacitor.isNativePlatform() &&
      WEB_ADS_CONFIG.hosts.includes(this.document.location.hostname);
  }

  slot(placement: WebAdPlacement): string {
    const slot = WEB_ADS_CONFIG.slots[placement];
    return this.enabled && /^\d+$/.test(slot) ? slot : '';
  }

  initialize(): void {
    if (!this.enabled || this.document.getElementById('web-adsense-script')) return;
    const script = this.document.createElement('script');
    script.id = 'web-adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.client}`;
    script.onerror = () => console.warn('AdSense no está disponible. El juego sigue funcionando.');
    this.document.head.appendChild(script);
  }

  requestAd(element: HTMLElement): void {
    if (!this.enabled || !element.isConnected || element.getBoundingClientRect().width <= 0 ||
        this.requested.has(element) || element.hasAttribute('data-adsbygoogle-status')) return;
    if (!Object.keys(WEB_ADS_CONFIG.slots).some(key =>
      this.slot(key as WebAdPlacement) === element.dataset['adSlot'])) return;
    const adsWindow = this.document.defaultView as AdsWindow | null;
    if (!adsWindow) return;
    this.initialize();
    try {
      adsWindow.adsbygoogle ??= [];
      this.requested.add(element);
      adsWindow.adsbygoogle.push({});
    } catch (error) {
      console.warn('No se ha podido cargar el anuncio de AdSense:', error);
    }
  }

  openPrivacyOptions(): void {
    if (!this.enabled) return;
    const adsWindow = this.document.defaultView as AdsWindow | null;
    if (!adsWindow) return;
    adsWindow.googlefc ??= { callbackQueue: [] };
    adsWindow.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => adsWindow.googlefc?.showRevocationMessage?.()
    });
  }
}
