import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Theme } from 'src/app/models/game.model';
import { THEME_DETAILS } from 'src/app/models/theme-options';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { ModalController } from '@ionic/angular';
import { IonRouterOutlet } from '@ionic/angular';
import { AdmobService } from 'src/app/services/admob.service';
import { openSettingsModal } from 'src/app/services/settings-modal';
import { WebAdsService } from 'src/app/services/web-ads.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';

@Component({
  selector: 'app-level',
  templateUrl: './level.component.html',
  styleUrls: ['./level.component.scss'],
  imports: [
    CommonModule,
    IonicModule,
    AppFooterComponent,
  ]
})
export class LevelComponent  implements OnInit, AfterViewInit {
  private readonly admobService = inject(AdmobService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modalController = inject(ModalController);
  private readonly routerOutlet = inject(IonRouterOutlet);
  private readonly webAdsService = inject(WebAdsService);
  readonly platform = inject(Platform);

  tematica: Theme = 'general';

  ngAfterViewInit(): void {
    this.webAdsService.requestAd();
  }

  get temaActual(): { nombre: string; icono: string } {
    return THEME_DETAILS[this.tematica];
  }

  async openUserSettings(): Promise<void> {
    await openSettingsModal(this.modalController, UserSettingsComponent, 'user-settings-modal', this.routerOutlet.nativeEl);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tema = params['theme'] as Theme;
      this.tematica = tema in THEME_DETAILS ? tema : 'general';
      this.admobService.showBannerBottomCenter();
    });
  }

  iniciarJuego(nivel: string): void {
    this.router.navigate(['/game', this.tematica, nivel]);
  }

  volver(): void {
    this.router.navigate(['/tematicas']);
  }

  irAlInicio(): void {
    this.router.navigate(['/']);
  }
}
