import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, IonRouterOutlet, ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Theme, Level, GameState } from 'src/app/models/game.model';
import { GameService } from 'src/app/services/game.service';
import { AdmobService } from 'src/app/services/admob.service';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { AudioService } from 'src/app/services/audio.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  imports: [CommonModule, IonicModule]
})
export class GameComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly juegoService = inject(GameService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly routerOutlet = inject(IonRouterOutlet);
  private readonly admobService = inject(AdmobService);
  private readonly audioService = inject(AudioService);
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
      this.nivel = esRetoDiario || nivel === 'diario' ? 'diario' : (nivel === 'avanzado' ? 'avanzado' : 'normal');
      this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
    }));

    this.subscription.add(this.juegoService.GameState$.subscribe(estado => {
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
    if (this.nivel === 'diario' && this.estado && !this.estado.winner) {
      const aviso = await this.alertController.create({
        header: 'Intento diario agotado',
        message: 'Para volver a intentarlo tendrás que ver un anuncio. Los intentos extra todavía no están disponibles.',
        buttons: ['Entendido']
      });
      await aviso.present();
      return;
    }

    this.admobService.showInterstitial();
    this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
  }

  volverAlMenu(): void {
    this.router.navigate(['/']);
  }
}
