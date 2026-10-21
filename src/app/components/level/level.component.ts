import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Theme } from 'src/app/models/game.model';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { ModalController } from '@ionic/angular';
import { IonRouterOutlet } from '@ionic/angular';
import { AdmobService } from 'src/app/services/admob.service';
import { AudioService } from 'src/app/services/audio.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';

@Component({
  selector: 'app-level',
  templateUrl: './level.component.html',
  styleUrls: ['./level.component.scss'],
  imports: [   CommonModule,
    FormsModule,
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
  private readonly audioService = inject(AudioService);
  readonly platform = inject(Platform);

 tematica: Theme = 'general';
  readonly temas: Record<Theme, { nombre: string; icono: string }> = {
    deportes: { nombre: 'Deportes', icono: '⚽' },
    ciencia: { nombre: 'Ciencia', icono: '🔬' },
    infantil: { nombre: 'Infantil', icono: '🎨' },
    general: { nombre: 'General', icono: '📚' },
    animales: { nombre: 'Animales', icono: '🐾' },
    comida: { nombre: 'Comida', icono: '🍓' },
    naturaleza: { nombre: 'Naturaleza', icono: '🌿' },
    tecnologia: { nombre: 'Tecnología', icono: '💻' }
  };

  ngAfterViewInit(): void {
    if (!this.platform.is('hybrid')) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (error) {
        console.error('Error cargando el anuncio de dificultad', error);
      }
    }
  }

  get temaActual(): { nombre: string; icono: string } {
    return this.temas[this.tematica] ?? this.temas.general;
  }


async openVolumeSettings() {
  const modal = await this.modalController.create({
    component: VolumeSidebarComponent,
    cssClass: 'volume-sidebar-modal',
    breakpoints: [0, 0.8, 1],
    initialBreakpoint: 1,
    presentingElement: this.routerOutlet.nativeEl
  });
  await modal.present();
  await modal.onDidDismiss();
}

async openUserSettings() {
  const modal = await this.modalController.create({ component: UserSettingsComponent, cssClass: 'user-settings-modal', breakpoints: [0, 0.8, 1], initialBreakpoint: 1, presentingElement: this.routerOutlet.nativeEl });
  await modal.present();
}
  get isMuted(): boolean {
    return this.audioService.getVolume() === 0;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tema = params['theme'] as Theme;
      this.tematica = tema in this.temas ? tema : 'general';
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
