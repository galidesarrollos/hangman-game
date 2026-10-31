import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { NativeAdFeed, NativeAdPluginEvents, NativeAdTemplate } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { IonRouterOutlet } from '@ionic/angular';

import { AdmobService } from 'src/app/services/admob.service';
import { StatsService } from 'src/app/services/stats.service';
import { openSettingsModal } from 'src/app/services/settings-modal';
import { WebAdsService } from 'src/app/services/web-ads.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start-ad.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AppFooterComponent
  ]
})
export class StartComponent implements ViewWillEnter, ViewWillLeave, AfterViewInit {
  @ViewChild('nativeAdSlot') private nativeAdSlot?: ElementRef<HTMLElement>;
  @ViewChild(IonContent) private content?: IonContent;
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly routerOutlet = inject(IonRouterOutlet);
  private readonly admobService = inject(AdmobService);
  readonly platform = inject(Platform);
  private readonly statsService = inject(StatsService);
  private readonly webAdsService = inject(WebAdsService);

  timeTrialAvailable = true;
  timeTrialNeedsAd = false;
  timeTrialResult: 'won' | 'lost' | null = null;
  private timeTrialStarting = false;
  readonly nativeAdEnabled = this.platform.is('hybrid') && (!environment.production || !!this.nativeAdUnitId);
  nativeAdFailed = false;
  private nativeAdFeed?: NativeAdFeed;
  private nativeAdSetup?: Promise<void>;
  private viewActive = false;

  private get nativeAdUnitId(): string {
    return Capacitor.getPlatform() === 'ios' ? environment.nativeIosAdUnitId : environment.nativeAndroidAdUnitId;
  }

  constructor() {
    this.refreshTimeTrial();
  }

  async ionViewWillEnter() {
    this.viewActive = true;
    this.refreshTimeTrial();
    this.nativeAdFailed = false;
    if (this.platform.is('hybrid')) {
      if (this.nativeAdEnabled) {
        this.nativeAdSetup = this.showNativeAd();
        await this.nativeAdSetup;
      }
      else await this.admobService.showBannerBottomCenter();
    }
  }

  async ionViewWillLeave(): Promise<void> {
    this.viewActive = false;
    await this.nativeAdSetup;
    this.nativeAdSetup = undefined;
    if (this.nativeAdFeed) {
      await this.nativeAdFeed.destroy();
      this.nativeAdFeed = undefined;
    }
    if (this.nativeAdEnabled) {
      await this.admobService.restoreBanner('start-screen');
    }
  }

  private async showNativeAd(): Promise<void> {
    try {
      if (!await this.admobService.initialize(false)) {
        this.nativeAdFailed = true;
        return;
      }
      if (!this.viewActive) return;
      await this.admobService.hideBannerForNativeAd('start-screen');
      if (!this.viewActive) return;
      const feed = await NativeAdFeed.create({
        feedId: 'start-screen',
        template: NativeAdTemplate.Medium,
        scrollElement: await this.content?.getScrollElement(),
        ...(environment.production ? { adId: this.nativeAdUnitId } : { isTesting: true }),
        style: { backgroundColor: '#20243b', cornerRadius: 14, headlineColor: '#ffffff' }
      });
      if (!this.viewActive) {
        await feed.destroy();
        return;
      }
      this.nativeAdFeed = feed;
      await feed.addListener(NativeAdPluginEvents.FailedToLoad, error => {
        console.warn('El anuncio nativo no se ha cargado:', error);
        this.nativeAdFailed = true;
        void feed.destroy();
        if (this.nativeAdFeed === feed) this.nativeAdFeed = undefined;
        void this.admobService.restoreBanner('start-screen');
      });
      if (this.nativeAdSlot) feed.attach('start-ad', this.nativeAdSlot.nativeElement);
    } catch (error) {
      console.warn('No se ha podido mostrar el anuncio nativo:', error);
      this.nativeAdFailed = true;
      await this.admobService.restoreBanner('start-screen');
    }
  }

  ngAfterViewInit() {
    this.webAdsService.requestAd();
  }

  async openUserSettings(): Promise<void> {
    await this.nativeAdFeed?.pause();
    try {
      await openSettingsModal(this.modalController, UserSettingsComponent, 'user-settings-modal', this.routerOutlet.nativeEl);
    } finally {
      this.nativeAdFeed?.resume();
    }
  }

  async openThemeSelector(): Promise<void> {
    await this.router.navigate(['/tematicas']);
  }

  async startTimeTrial(): Promise<void> {
    if (!this.timeTrialAvailable || this.timeTrialStarting) return;
    this.timeTrialStarting = true;
    try {
      if (this.timeTrialNeedsAd) {
        if (!await this.admobService.showRewardedVideo()) return;
        if (!this.statsService.unlockTimeTrialRetry()) return;
        this.refreshTimeTrial();
      }
      await this.router.navigate(['/contrarreloj']);
    } finally {
      this.timeTrialStarting = false;
    }
  }

  private refreshTimeTrial(): void {
    this.timeTrialResult = this.statsService.getTimeTrialResult();
    const attempts = this.statsService.getTimeTrialAttempts();
    this.timeTrialNeedsAd = attempts > 0 && this.statsService.getTimeTrialRetriesUnlocked() < attempts;
    this.timeTrialAvailable = attempts < 3 && this.timeTrialResult !== 'won' &&
      (!this.timeTrialNeedsAd || this.platform.is('hybrid'));
  }
}
