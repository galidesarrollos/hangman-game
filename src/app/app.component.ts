import { Component, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AdmobService } from './services/admob.service';
import { Router } from '@angular/router';

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

  showPrivacyNotice = localStorage.getItem('privacyNoticeDismissed') !== 'true';

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

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
