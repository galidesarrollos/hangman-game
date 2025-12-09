import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { IonRouterOutlet } from '@ionic/angular';

import { AdmobService } from 'src/app/services/admob.service';
import { AdMob } from '@capacitor-community/admob';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class StartComponent implements ViewWillEnter, AfterViewInit {

  tematicas = [
    { id: 'deportes', nombre: 'Deportes', icono: '⚽', descripcion: 'Palabras relacionadas con deportes' },
    { id: 'ciencia', nombre: 'Ciencia', icono: '🔬', descripcion: 'Términos científicos y naturales' },
    { id: 'infantil', nombre: 'Infantil', icono: '🎨', descripcion: 'Palabras divertidas para los más pequeños' },
    { id: 'general', nombre: 'General', icono: '📚', descripcion: 'Vocabulario general y cotidiano' }
  ];

  constructor(
    private router: Router,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private admobService: AdmobService,
    private platform: Platform
  ) {}

  async ionViewWillEnter() {
    if (this.platform.is('hybrid')) {
      this.admobService.showBannerBottomCenter();
      // Solo muestra el banner de AdMob si es app nativa (Android/iOS)
    }
  }

  ngAfterViewInit() {
    // Solo inicializa AdSense si NO es app (es decir, si es navegador web)
    if (!this.platform.is('hybrid')) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
        console.log('AdSense cargado en versión web.');
      } catch (e) {
        console.error('Error cargando AdSense', e);
      }
    }
  }

  async openVolumeSettings() {
    const modal = await this.modalController.create({
      component: VolumeSidebarComponent,
      cssClass: 'volume-sidebar-modal',
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.8,
      presentingElement: this.routerOutlet.nativeEl
    });
    await modal.present();
  }

  seleccionarTematica(tematica: string): void {
    // Solo muestra interstitial en app (AdMob)
    if (this.platform.is('hybrid')) {
      // this.admobService.showInterstitial();
    }
    this.router.navigate(['/level', tematica]);
  }
}
