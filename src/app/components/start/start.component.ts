import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { IonRouterOutlet } from '@ionic/angular';

import { AdmobService } from 'src/app/services/admob.service';
import { AudioService } from 'src/app/services/audio.service';
import { GameStats, StatsService } from 'src/app/services/stats.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterLink
  ]
})
export class StartComponent implements ViewWillEnter, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly routerOutlet = inject(IonRouterOutlet);
  private readonly admobService = inject(AdmobService);
  private readonly platform = inject(Platform);
  private readonly audioService = inject(AudioService);
  private readonly statsService = inject(StatsService);

  estadisticas: GameStats;
  retoDiarioDisponible = true;
  showDailyModal = false;
  dailyCountdown = '';
  private dailyTimer?: ReturnType<typeof setInterval>;

  tematicas = [
    { id: 'deportes', nombre: 'Deportes', icono: '⚽', descripcion: 'Palabras relacionadas con deportes' },
    { id: 'ciencia', nombre: 'Ciencia', icono: '🔬', descripcion: 'Términos científicos y naturales' },
    { id: 'infantil', nombre: 'Infantil', icono: '🎨', descripcion: 'Palabras divertidas para los más pequeños' },
    { id: 'general', nombre: 'General', icono: '📚', descripcion: 'Vocabulario general y cotidiano' },
    { id: 'animales', nombre: 'Animales', icono: '🐾', descripcion: 'Animales de todo el mundo' },
    { id: 'comida', nombre: 'Comida', icono: '🍓', descripcion: 'Ingredientes y platos para abrir el apetito' },
    { id: 'naturaleza', nombre: 'Naturaleza', icono: '🌿', descripcion: 'Paisajes, clima y vida natural' },
    { id: 'tecnologia', nombre: 'Tecnología', icono: '💻', descripcion: 'Objetos y conceptos digitales' }
  ];

  constructor() {
    this.estadisticas = this.statsService.getStats();
    this.retoDiarioDisponible = this.statsService.isDailyAvailable();
    this.startDailyClock();
  }

  get isMuted(): boolean {
    return this.audioService.getVolume() === 0;
  }

  async ionViewWillEnter() {
    this.estadisticas = this.statsService.getStats();
    this.retoDiarioDisponible = this.statsService.isDailyAvailable();
    this.showDailyModal = this.retoDiarioDisponible && sessionStorage.getItem(this.dailyPromptKey()) !== 'shown';
    if (this.showDailyModal) sessionStorage.setItem(this.dailyPromptKey(), 'shown');
    this.startDailyClock();
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
      breakpoints: [0, 0.8, 1],
      initialBreakpoint: 1,
      presentingElement: this.routerOutlet.nativeEl
    });
    await modal.present();
    await modal.onDidDismiss();
  }

  seleccionarTematica(tematica: string): void {
    this.router.navigate(['/level', tematica]);
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
  }

  private dailyPromptKey(): string {
    const today = new Date();
    return `dailyPrompt-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  ngOnDestroy(): void {
    if (this.dailyTimer) clearInterval(this.dailyTimer);
  }
}
