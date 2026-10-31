import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, Platform, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { NativeAdFeed, NativeAdPluginEvents, NativeAdTemplate } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { AdmobService } from 'src/app/services/admob.service';
import { THEME_OPTIONS } from 'src/app/models/theme-options';
import { Theme } from 'src/app/models/game.model';
import { WebAdsService } from 'src/app/services/web-ads.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';
import { ScreenActionsComponent } from '../screen-actions/screen-actions.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, IonicModule, AppFooterComponent, ScreenActionsComponent],
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.scss']
})
export class ThemeSelectorComponent implements AfterViewInit, ViewWillEnter, ViewWillLeave {
  @ViewChild('nativeAdSlot') private nativeAdSlot?: ElementRef<HTMLElement>;
  @ViewChild(IonContent) private content?: IonContent;
  readonly tematicas = THEME_OPTIONS;
  readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly admobService = inject(AdmobService);
  private readonly webAdsService = inject(WebAdsService);
  readonly nativeAdEnabled = this.platform.is('hybrid') && (!environment.production || !!this.nativeAdUnitId);
  nativeAdFailed = false;
  private nativeAdFeed?: NativeAdFeed;
  private nativeAdSetup?: Promise<void>;
  private viewActive = false;

  private get nativeAdUnitId(): string {
    return Capacitor.getPlatform() === 'ios' ? environment.nativeIosAdUnitId : environment.nativeAndroidAdUnitId;
  }

  async ionViewWillEnter(): Promise<void> {
    this.viewActive = true;
    this.nativeAdFailed = false;
    if (!this.platform.is('hybrid')) return;
    if (this.nativeAdEnabled) {
      this.nativeAdSetup = this.showNativeAd();
      await this.nativeAdSetup;
    } else {
      await this.admobService.showBannerBottomCenter();
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
    if (this.nativeAdEnabled) await this.admobService.restoreBanner('theme-selector');
  }

  private async showNativeAd(): Promise<void> {
    try {
      if (!await this.admobService.initialize(false)) {
        this.nativeAdFailed = true;
        return;
      }
      if (!this.viewActive) return;
      await this.admobService.hideBannerForNativeAd('theme-selector');
      if (!this.viewActive) return;
      const feed = await NativeAdFeed.create({
        feedId: 'theme-selector',
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
        console.warn('El anuncio nativo de categorías no se ha cargado:', error);
        this.nativeAdFailed = true;
        void feed.destroy();
        if (this.nativeAdFeed === feed) this.nativeAdFeed = undefined;
        void this.admobService.restoreBanner('theme-selector');
      });
      if (this.nativeAdSlot) feed.attach('theme-selector-ad', this.nativeAdSlot.nativeElement);
    } catch (error) {
      console.warn('No se ha podido mostrar el anuncio nativo de categorías:', error);
      this.nativeAdFailed = true;
      await this.admobService.restoreBanner('theme-selector');
    }
  }

  readonly pauseNativeAd = async (): Promise<void> => { await this.nativeAdFeed?.pause(); };
  readonly resumeNativeAd = (): void => { this.nativeAdFeed?.resume(); };

  ngAfterViewInit(): void {
    this.webAdsService.requestAd();
  }
  seleccionar(tematica: Theme): void { void this.router.navigate(['/level', tematica]); }
  volver(): void { void this.router.navigate(['/']); }
}
