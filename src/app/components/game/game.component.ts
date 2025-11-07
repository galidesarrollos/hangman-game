import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Theme, Level, GameState } from 'src/app/models/game.model';
import { GameService } from 'src/app/services/game.service';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { ModalController } from '@ionic/angular';
import { IonRouterOutlet } from '@ionic/angular';

import { AdmobService } from 'src/app/services/admob.service';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
    imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ]
})
export class GameComponent  implements OnInit, OnDestroy {


    showVolumeSidebar = false;

async openVolumeSettings() {
  const modal = await this.modalController.create({
    component: VolumeSidebarComponent,
    cssClass: 'volume-sidebar-modal',
    breakpoints: [0, 0.5, 0.8],
    initialBreakpoint: 0.8,
    presentingElement: this.routerOutlet.nativeEl // Use nativeEl
  });
  await modal.present();
}

esIncorrecto(_t51: string) {
  if(_t51 && this.estado) {
    return this.estado.lettersFailed.has(_t51);
  }
  return false;
}

 tematica: Theme = 'general';
  nivel: Level = 'normal';
  estado: GameState | null = null;
  palabraVisible: string = '';
  mostrarModal: boolean = false;
  letras: string[] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'Á', 'É', 'Í', 'Ó', 'Ú'
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private juegoService: GameService,
        private modalController: ModalController ,
      private routerOutlet: IonRouterOutlet,
      private admobService: AdmobService

  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tematica = params['theme'] as Theme;
      this.nivel = params['level'] as Level;
      this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
    });

    this.subscription.add(
      this.juegoService.GameState$.subscribe(estado => {
        this.estado = estado;
        if (estado.secretWord) {
          this.palabraVisible = this.juegoService.obtenerPalabraVisible(
            estado.secretWord,
            estado.lettersGuessed
          );
        }
      })
    );
  }
  async abrirModalFinJuego() {
  this.mostrarModal = true;
  // Forzar la actualización de la vista y luego abrir el modal via trigger
  setTimeout(() => {
    document.getElementById('openFinJuegoModal')?.click();
  });
}

// Método para cerrar el modal
cerrarModal() {
  this.mostrarModal = false;
}

// Manejar el evento de dismiss
onModalDismiss() {
  this.mostrarModal = false;
}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  seleccionarLetra(letra: string): void {
    this.juegoService.adivinarLetra(letra);
  }

  letraUsada(letra: string): boolean {
    if (!this.estado) return false;
    return this.estado.lettersGuessed.has(letra) || this.estado.lettersFailed.has(letra);
  }

  obtenerLetrasArray(set: Set<string>): string[] {
    return Array.from(set);
  }

  jugarDeNuevo(): void {
    this.admobService.showInterstitial();
    this.juegoService.iniciarNuevoJuego(this.tematica, this.nivel);
  }

  volverAlMenu(): void {
    // this.admobService.showInterstitial();
    this.router.navigate(['/']);
  }
}
