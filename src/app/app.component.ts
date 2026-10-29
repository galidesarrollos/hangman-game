import { Component, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AdmobService } from './services/admob.service';
import { Router } from '@angular/router';
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
  readonly router = inject(Router);

  showPrivacyNotice = !this.platform.is('hybrid') && localStorage.getItem('privacyNoticeDismissed') !== 'true';

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    if (this.platform.is('hybrid') && this.platform.is('android')) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#101322' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        console.error('Error al configurar la barra de estado:', err);
      }
    }

    try {
      await this.admobService.initialize();
    } catch (err) {
      console.error('Error al inicializar AdMob:', err);
    }
  }

  dismissPrivacyNotice(): void {
    localStorage.setItem('privacyNoticeDismissed', 'true');
    this.showPrivacyNotice = false;
  }
}
