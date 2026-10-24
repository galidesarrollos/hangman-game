import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
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
export class StartComponent implements ViewWillEnter, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly routerOutlet = inject(IonRouterOutlet);
  private readonly admobService = inject(AdmobService);
  readonly platform = inject(Platform);
  private readonly statsService = inject(StatsService);
  private readonly webAdsService = inject(WebAdsService);

  retoDiarioDisponible = true;
  dailyResult: 'won' | 'lost' | null = null;
  showDailyModal = false;
  dailyCountdown = '';
  private dailyTimer?: ReturnType<typeof setInterval>;

  constructor() {
    this.retoDiarioDisponible = this.statsService.isDailyAvailable();
    this.dailyResult = this.statsService.getDailyResult();
    this.startDailyClock();
  }

  async ionViewWillEnter() {
    this.retoDiarioDisponible = this.statsService.isDailyAvailable();
    this.dailyResult = this.statsService.getDailyResult();
    this.startDailyClock();
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

  iniciarRetoDiario(): void {
    this.router.navigate(['/reto-diario']);
  }

  openDailyModal(): void {
    this.showDailyModal = true;
  }

  closeDailyModal(): void {
    this.showDailyModal = false;
  }

  private startDailyClock(): void {
    this.updateDailyClock();
    if (!this.dailyTimer) this.dailyTimer = setInterval(() => this.updateDailyClock(), 1000);
  }

  private updateDailyClock(): void {
    const remaining = this.statsService.getDailyRemainingMs();
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    this.dailyCountdown = `${hours} h ${String(minutes).padStart(2, '0')} min ${String(seconds).padStart(2, '0')} s`;
    this.retoDiarioDisponible = this.statsService.isDailyAvailable();
    this.dailyResult = this.statsService.getDailyResult();
  }

  ngOnDestroy(): void {
    if (this.dailyTimer) clearInterval(this.dailyTimer);
  }
}
