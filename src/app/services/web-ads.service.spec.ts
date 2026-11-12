import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { WEB_ADS_CONFIG } from '../config/web-ads.config';
import { WebAdsService } from './web-ads.service';

describe('WebAdsService', () => {
  let service: WebAdsService;
  let head: HTMLElement;
  let adWindow: { adsbygoogle?: unknown[]; googlefc?: { callbackQueue: Record<string, () => void>[]; showRevocationMessage?: jasmine.Spy } };
  let previousSlot: string;
  let previousProduction: boolean;

  beforeEach(() => {
    head = document.createElement('head');
    adWindow = {};
    previousSlot = WEB_ADS_CONFIG.slots.themes;
    previousProduction = environment.production;
    environment.production = true;
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: {
      location: { hostname: 'localhost' },
      head,
      defaultView: adWindow,
      createElement: (tag: string) => document.createElement(tag),
      getElementById: (id: string) => head.querySelector(`#${id}`)
    } }] });
    service = TestBed.inject(WebAdsService);
  });

  afterEach(() => {
    WEB_ADS_CONFIG.slots.themes = previousSlot;
    environment.production = previousProduction;
  });

  it('does not load ads on localhost', () => {
    service.initialize();
    expect(head.childElementCount).toBe(0);
    expect(service.slot('themes')).toBe('');
  });

  it('does not load AdSense in native apps', () => {
    TestBed.inject(DOCUMENT).location.hostname = WEB_ADS_CONFIG.hosts[0];
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    service.initialize();
    expect(head.childElementCount).toBe(0);
  });

  it('loads the script only once', () => {
    spyOnProperty(service, 'enabled', 'get').and.returnValue(true);
    service.initialize();
    service.initialize();
    expect(head.querySelectorAll('script').length).toBe(1);
    expect(head.querySelector('script')?.src).toContain(WEB_ADS_CONFIG.client);
  });

  it('rejects empty and provisional slots', () => {
    spyOnProperty(service, 'enabled', 'get').and.returnValue(true);
    WEB_ADS_CONFIG.slots.themes = '';
    expect(service.slot('themes')).toBe('');
    WEB_ADS_CONFIG.slots.themes = 'REEMPLAZAR_CON_SLOT_ADSENSE';
    expect(service.slot('themes')).toBe('');
  });

  it('waits for a visible width and requests each element only once', () => {
    spyOnProperty(service, 'enabled', 'get').and.returnValue(true);
    WEB_ADS_CONFIG.slots.themes = '1234567890';
    const element = document.createElement('ins');
    element.dataset['adSlot'] = '1234567890';
    document.body.appendChild(element);
    const rect = spyOn(element, 'getBoundingClientRect').and.returnValue({ width: 0 } as DOMRect);
    try {
      service.requestAd(element);
      expect(adWindow.adsbygoogle).toBeUndefined();
      rect.and.returnValue({ width: 320 } as DOMRect);
      service.requestAd(element);
      service.requestAd(element);
      expect(adWindow.adsbygoogle?.length).toBe(1);
    } finally { element.remove(); }
  });

  it('reopens Google consent using its callback queue', () => {
    spyOnProperty(service, 'enabled', 'get').and.returnValue(true);
    service.openPrivacyOptions();
    const reopen = jasmine.createSpy('showRevocationMessage');
    adWindow.googlefc!.showRevocationMessage = reopen;
    adWindow.googlefc!.callbackQueue[0]['CONSENT_API_READY']();
    expect(reopen).toHaveBeenCalledTimes(1);
  });
});
