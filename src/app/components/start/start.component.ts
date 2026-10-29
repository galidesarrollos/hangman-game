import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { IonRouterOutlet } from '@ionic/angular';

import { AdmobService } from 'src/app/services/admob.service';
import { StatsService } from 'src/app/services/stats.service';
import { openSettingsModal } from 'src/app/services/settings-modal';
import { WebAdsService } from 'src/app/services/web-ads.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AppFooterComponent
  ]
})
export class StartComponent implements ViewWillEnter, AfterViewInit {
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

  constructor() {
    this.refreshTimeTrial();
  }

  async ionViewWillEnter() {
    this.refreshTimeTrial();
    if (this.platform.is('hybrid')) {
      this.admobService.showBannerBottomCenter();
      // Solo muestra el banner de AdMob si es app nativa (Android/iOS)
    }
  }

  ngAfterViewInit() {
    this.webAdsService.requestAd();
  }

  async openUserSettings(): Promise<void> {
    await openSettingsModal(this.modalController, UserSettingsComponent, 'user-settings-modal', this.routerOutlet.nativeEl);
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
