import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, IonRouterOutlet, ModalController, Platform, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Theme, Level, GameState } from 'src/app/models/game.model';
import { THEME_DETAILS } from 'src/app/models/theme-options';
import { GameService } from 'src/app/services/game.service';
import { AdmobService } from 'src/app/services/admob.service';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { AudioService } from 'src/app/services/audio.service';
import { StatsService } from 'src/app/services/stats.service';
import { openSettingsModal } from 'src/app/services/settings-modal';
import { ScreenActionsComponent } from '../screen-actions/screen-actions.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  imports: [CommonModule, IonicModule, ScreenActionsComponent]
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
  readonly temas = THEME_DETAILS;

  tematica: Theme = 'general';
  nivel: Level = 'normal';
  estado: GameState | null = null;
  casillas: string[] = [];
  readonly timeTrialTimes = [90, 60, 45, 30, 20];
  timeTrialLevel = 1;
  remainingSeconds = 0;
  isTimeTrial = false;
  private partidaFinalizadaMostrada = false;
  private anuncioRecompensadoEnCurso = false;
  private timeTrialTimer?: ReturnType<typeof setInterval>;
  private timeTrialNextLevelTimeout?: ReturnType<typeof setTimeout>;

  private readonly subscription = new Subscription();

  get isMuted(): boolean {
    return this.audioService.getVolume() === 0;
  }

  toggleMute(): void {
    this.audioService.toggleMute();
  }

  get fallos(): number {
    return 7 - (this.estado?.attemptsRemaining ?? 7);
  }

  ngOnInit(): void {
    this.subscription.add(this.route.params.subscribe(params => {
      this.isTimeTrial = this.route.snapshot.routeConfig?.path === 'contrarreloj';
      const esRetoDiario = !this.isTimeTrial && !params['theme'] && !params['level'];
      const tema = params['theme'] as Theme;
      const nivel = params['level'] as Level;
      this.tematica = tema in THEME_DETAILS ? tema : 'general';
      this.nivel = this.isTimeTrial ? 'contrarreloj' : esRetoDiario || nivel === 'diario' ? 'diario' : (nivel === 'avanzado' ? 'avanzado' : (nivel === 'facil' ? 'facil' : 'normal'));
      if (this.isTimeTrial) {
        if (!this.statsService.startTimeTrialAttempt()) void this.router.navigate(['/']);
        else this.startTimeTrialLevel(1);
      } else if (!this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel) && this.nivel === 'diario') {
        void this.router.navigate(['/']);
      }
    }));

    if (this.platform.is('hybrid')) this.admobService.showBannerBottomCenter();

    this.subscription.add(this.juegoService.GameState$.subscribe(estado => {
      if (estado.gameOver && !this.partidaFinalizadaMostrada) {
        this.clearTimeTrialTimer();
        if (this.isTimeTrial && estado.winner && this.timeTrialLevel < this.timeTrialTimes.length) {
          this.partidaFinalizadaMostrada = true;
          this.timeTrialNextLevelTimeout = setTimeout(() => this.startTimeTrialLevel(this.timeTrialLevel + 1), 350);
        } else {
          if (this.isTimeTrial) this.statsService.completeTimeTrial(estado.winner);
          void this.mostrarFinPartida(estado);
        }
      }
      this.partidaFinalizadaMostrada = estado.gameOver;
      this.estado = estado;
      if (estado.theme) this.tematica = estado.theme;
      this.casillas = estado.secretWord
        ? this.juegoService.obtenerPalabraVisible(estado.secretWord, estado.lettersGuessed).split(' ')
        : [];
    }));
  }

  ngOnDestroy(): void {
    this.clearTimeTrialTimer();
    this.subscription.unsubscribe();
  }

  async openUserSettings(): Promise<void> {
    await openSettingsModal(this.modalController, UserSettingsComponent, 'user-settings-modal', this.routerOutlet.nativeEl);
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
    this.partidaFinalizadaMostrada = false;
    this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
  }

  get puedePedirPista(): boolean {
    return !this.isTimeTrial && !!this.estado && !this.estado.gameOver && this.estado.lettersGuessed.size < new Set(this.estado.secretWord).size;
  }

  get pistaEnUltimoIntento(): boolean {
    return this.puedePedirPista && this.estado?.attemptsRemaining === 1;
  }

  async confirmarPista(): Promise<void> {
    if (!this.puedePedirPista || this.anuncioRecompensadoEnCurso) return;
    const aviso = await this.alertController.create({
      header: '¿Pedir una pista?',
      message: 'Una pista revelará una letra de la palabra. Para obtenerla debes completar un anuncio recompensado.',
      cssClass: 'hint-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Ver anuncio', handler: () => this.verAnuncioYPedirPista() }
      ]
    });
    await aviso.present();
  }

  private async verAnuncioYPedirPista(): Promise<boolean> {
    if (this.anuncioRecompensadoEnCurso) return false;
    this.anuncioRecompensadoEnCurso = true;
    try {
      const recompensaObtenida = await this.admobService.showRewardedVideo();
      if (recompensaObtenida && this.juegoService.usarPista()) return true;
      await this.mostrarAvisoAnuncioFallido();
      return false;
    } catch (error) {
      console.warn('No se ha podido obtener la pista:', error);
      await this.mostrarAvisoAnuncioFallido();
      return false;
    } finally {
      this.anuncioRecompensadoEnCurso = false;
    }
  }

  private async solicitarReintento(): Promise<boolean> {
    if (this.anuncioRecompensadoEnCurso || !this.estado?.gameOver || this.estado.winner) return false;
    this.anuncioRecompensadoEnCurso = true;
    try {
      const recompensaObtenida = this.isTimeTrial && this.statsService.areTimeTrialRetriesUnlocked()
        ? true : await this.admobService.showRewardedVideo();
      if (this.isTimeTrial && recompensaObtenida) this.statsService.unlockTimeTrialRetries();
      const reintentoAceptado = this.isTimeTrial
        ? recompensaObtenida && this.statsService.startTimeTrialAttempt()
        : this.nivel === 'diario' ? recompensaObtenida && await this.admobService.showRewardedVideo() && this.juegoService.reintentarRetoDiario()
          : recompensaObtenida && await this.admobService.showRewardedVideo();
      if (reintentoAceptado) {
        this.partidaFinalizadaMostrada = false;
        if (this.isTimeTrial) this.startTimeTrialLevel(1);
        else if (this.nivel !== 'diario') this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
        return true;
      } else {
        await this.mostrarAvisoAnuncioFallido();
        return false;
      }
    } catch (error) {
      console.warn('No se ha podido completar el reintento:', error);
      await this.mostrarAvisoAnuncioFallido();
      return false;
    } finally {
      this.anuncioRecompensadoEnCurso = false;
    }
  }

  private async mostrarAvisoAnuncioFallido(): Promise<void> {
    const aviso = await this.toastController.create({ message: 'No se completó el anuncio. Puedes intentarlo de nuevo.', duration: 3000, position: 'top' });
    await aviso.present();
  }

  private async mostrarFinPartida(estado: GameState): Promise<void> {
    if (this.statsService.consumeDailyGamesInterstitial()) {
      try {
        await this.admobService.showInterstitial();
      } catch (error) {
        console.warn('No se ha podido mostrar el anuncio intersticial diario:', error);
      }
    }
    await (estado.winner ? this.mostrarResultado(estado) : this.mostrarDerrota(estado));
  }

  private async mostrarDerrota(estado: GameState): Promise<void> {
    const puedeReintentar = (this.isTimeTrial && this.statsService.areTimeTrialRetriesUnlocked() || this.platform.is('hybrid')) &&
      (this.isTimeTrial ? this.statsService.getTimeTrialRetriesRemaining() > 0 : this.nivel !== 'diario' || this.statsService.isDailyRetryAvailable());
    const aviso = await this.alertController.create({
      header: 'Esta vez no pudo ser',
      backdropDismiss: false,
      message: this.isTimeTrial
        ? `Has llegado al nivel ${this.timeTrialLevel} de 5. La palabra era ${estado.secretWord}.\n\nSi reintentas, volverás al nivel 1. Te quedan ${this.statsService.getTimeTrialRetriesRemaining()} reintentos hoy.`
        : `La palabra era ${estado.secretWord}.\n\nPuntuación: ${estado.score}\nRacha: ${estado.streak}`,
      cssClass: 'game-result-alert game-result-alert-lost',
      buttons: [
        ...(puedeReintentar ? [{ text: this.isTimeTrial && this.statsService.areTimeTrialRetriesUnlocked() ? 'Reintentar' : 'Ver anuncio y reintentar', handler: () => this.solicitarReintento() }] : []),
        { text: 'Volver al menú', handler: () => this.volverAlMenu() }
      ]
    });
    await aviso.present();
  }

  private async mostrarResultado(estado: GameState): Promise<void> {
    const aviso = await this.alertController.create({
      header: this.isTimeTrial ? '¡Contrarreloj superado!' : '¡Palabra descubierta!',
      backdropDismiss: false,
      message: this.isTimeTrial ? 'Has completado los cinco niveles antes de que se agotara el tiempo.' : `La palabra era ${estado.secretWord}.\n\nPuntuación: ${estado.score}\nRacha: ${estado.streak}`,
      cssClass: 'game-result-alert game-result-alert-won',
      buttons: [
        ...(this.nivel === 'diario' || this.isTimeTrial ? [] : [{ text: 'Jugar otra vez', handler: () => void this.jugarDeNuevo() }]),
        { text: 'Volver al menú', handler: () => this.volverAlMenu() }
      ]
    });
    await aviso.present();
  }

  volverAlMenu(): void {
    this.router.navigate(['/']);
  }

  volverANiveles(): void {
    this.router.navigate(['/level', this.tematica]);
  }

  private startTimeTrialLevel(level: number): void {
    this.clearTimeTrialTimer();
    this.timeTrialLevel = level;
    this.remainingSeconds = this.timeTrialTimes[level - 1];
    this.partidaFinalizadaMostrada = false;
    this.juegoService.iniciarContrarreloj(level);
    this.timeTrialTimer = setInterval(() => {
      this.remainingSeconds -= 1;
      if (this.remainingSeconds <= 0) {
        this.clearTimeTrialTimer();
        this.juegoService.finalizarPorTiempo();
      }
    }, 1000);
  }

  private clearTimeTrialTimer(): void {
    if (this.timeTrialTimer) clearInterval(this.timeTrialTimer);
    if (this.timeTrialNextLevelTimeout) clearTimeout(this.timeTrialNextLevelTimeout);
    this.timeTrialTimer = undefined;
    this.timeTrialNextLevelTimeout = undefined;
  }
}
