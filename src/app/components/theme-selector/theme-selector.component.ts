import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform, ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdmobService } from 'src/app/services/admob.service';
import { THEME_OPTIONS } from 'src/app/models/theme-options';
import { Theme } from 'src/app/models/game.model';
import { WebAdsService } from 'src/app/services/web-ads.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';
import { ScreenActionsComponent } from '../screen-actions/screen-actions.component';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, IonicModule, AppFooterComponent, ScreenActionsComponent],
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.scss']
})
export class ThemeSelectorComponent implements AfterViewInit, ViewWillEnter {
  readonly tematicas = THEME_OPTIONS;
  readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly admobService = inject(AdmobService);
  private readonly webAdsService = inject(WebAdsService);

  ionViewWillEnter(): void {
    if (this.platform.is('hybrid')) void this.admobService.showBannerBottomCenter();
  }

  ngAfterViewInit(): void {
    this.webAdsService.requestAd();
  }
  seleccionar(tematica: Theme): void { void this.router.navigate(['/level', tematica]); }
  volver(): void { void this.router.navigate(['/']); }
}
