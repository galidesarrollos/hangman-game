import { Component, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AdmobService } from './services/admob.service';
import { WebAdsService } from './services/web-ads.service';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  private readonly platform = inject(Platform);
  private readonly admobService = inject(AdmobService);
  private readonly webAds = inject(WebAdsService);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    this.webAds.initialize();

    if (this.platform.is('hybrid') && this.platform.is('android')) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#101322' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        console.error('Error al configurar la barra de estado:', err);
      }
    }

    if (this.platform.is('hybrid') && this.platform.is('ios')) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        console.warn('No se ha podido configurar la barra de estado de iOS:', err);
      }
    }

    try {
      await this.admobService.initialize();
    } catch (err) {
      console.error('Error al inicializar AdMob:', err);
    }
  }
}
