import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, IonRouterOutlet, ModalController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Theme, Level, GameState } from 'src/app/models/game.model';
import { GameService } from 'src/app/services/game.service';
import { AdmobService } from 'src/app/services/admob.service';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { AudioService } from 'src/app/services/audio.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';
import { StatsService } from 'src/app/services/stats.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  imports: [CommonModule, IonicModule, AppFooterComponent]
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly juegoService = inject(GameService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly routerOutlet = inject(IonRouterOutlet);
  readonly platform = inject(Platform);
  private readonly admobService = inject(AdmobService);
  private readonly audioService = inject(AudioService);
  private readonly statsService = inject(StatsService);
  readonly letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  readonly nombresTematica: Record<Theme, string> = {
    deportes: 'Deportes',
    ciencia: 'Ciencia',
    infantil: 'Infantil',
    general: 'General',
    animales: 'Animales',
    comida: 'Comida',
    naturaleza: 'Naturaleza',
    tecnologia: 'Tecnología'
  };

  tematica: Theme = 'general';
  nivel: Level = 'normal';
  estado: GameState | null = null;
  casillas: string[] = [];
  private partidaFinalizadaMostrada = false;
  private anuncioRecompensadoEnCurso = false;

  private readonly subscription = new Subscription();

  get isMuted(): boolean {
    return this.audioService.getVolume() === 0;
  }

  get fallos(): number {
    return 7 - (this.estado?.attemptsRemaining ?? 7);
  }

  ngOnInit(): void {
    this.subscription.add(this.route.params.subscribe(params => {
      const esRetoDiario = !params['theme'] && !params['level'];
      const tema = params['theme'] as Theme;
      const nivel = params['level'] as Level;
      this.tematica = tema in this.nombresTematica ? tema : 'general';
      this.nivel = esRetoDiario || nivel === 'diario' ? 'diario' : (nivel === 'avanzado' ? 'avanzado' : (nivel === 'facil' ? 'facil' : 'normal'));
      this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
    }));

    if (this.platform.is('hybrid')) this.admobService.showBannerBottomCenter();

    this.subscription.add(this.juegoService.GameState$.subscribe(estado => {
      if (estado.gameOver && !this.partidaFinalizadaMostrada) void this.mostrarResultado(estado);
      this.partidaFinalizadaMostrada = estado.gameOver;
      this.estado = estado;
      if (estado.theme) this.tematica = estado.theme;
      this.casillas = estado.secretWord
        ? this.juegoService.obtenerPalabraVisible(estado.secretWord, estado.lettersGuessed).split(' ')
        : [];
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async openVolumeSettings(): Promise<void> {
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

  async openUserSettings(): Promise<void> {
    const modal = await this.modalController.create({ component: UserSettingsComponent, cssClass: 'user-settings-modal', breakpoints: [0, 0.8, 1], initialBreakpoint: 1, presentingElement: this.routerOutlet.nativeEl });
    await modal.present();
  }

  seleccionarLetra(letra: string): void {
    this.juegoService.adivinarLetra(letra);
  }

  letraUsada(letra: string): boolean {
    return !!this.estado && (this.estado.lettersGuessed.has(letra) || this.estado.lettersFailed.has(letra));
  }

  esIncorrecto(letra: string): boolean {
    return !!this.estado && this.estado.lettersFailed.has(letra);
  }

  async jugarDeNuevo(): Promise<void> {
    if (this.nivel === 'diario') return;

    this.admobService.showInterstitial();
    this.partidaFinalizadaMostrada = false;
    this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
  }

  private async verAnuncioYReintentar(): Promise<boolean> {
    if (this.anuncioRecompensadoEnCurso) return false;
    if (this.nivel !== 'diario' || !this.estado?.gameOver || this.estado.winner || !this.statsService.isDailyRetryAvailable()) return false;

    this.anuncioRecompensadoEnCurso = true;
    try {
      try {
        const recompensaObtenida = await this.admobService.showRewardedVideo();
        if (recompensaObtenida && this.juegoService.reintentarRetoDiario()) return true;
      } catch (error) {
        console.warn('No se ha podido completar el reintento diario:', error);
      }

      try {
        const aviso = await this.toastController.create({
          message: 'No se completó el anuncio. Puedes intentarlo de nuevo.',
          duration: 3000,
          position: 'top'
        });
        await aviso.present();
      } catch (error) {
        console.warn('No se ha podido mostrar el aviso del anuncio:', error);
      }
      return false;
    } finally {
      this.anuncioRecompensadoEnCurso = false;
    }
  }

  private async mostrarResultado(estado: GameState): Promise<void> {
    const aviso = await this.alertController.create({
      header: estado.winner ? '¡Palabra descubierta!' : 'Esta vez no pudo ser',
      backdropDismiss: false,
      message: `La palabra era ${estado.secretWord}.\n\nPuntuación: ${estado.score}\nRacha: ${estado.streak}`,
      cssClass: `game-result-alert ${estado.winner ? 'game-result-alert-won' : 'game-result-alert-lost'}`,
      buttons: [
        ...(this.nivel === 'diario'
          ? (!estado.winner && this.platform.is('hybrid') && this.statsService.isDailyRetryAvailable()
            ? [{ text: 'Ver anuncio y reintentar', handler: () => this.verAnuncioYReintentar() }]
            : [])
          : [{ text: 'Jugar otra vez', handler: () => void this.jugarDeNuevo() }]),
        { text: 'Volver al menú', handler: () => this.volverAlMenu() }
      ]
    });
    await aviso.present();
  }

  volverAlMenu(): void {
    this.router.navigate(['/']);
  }
}
