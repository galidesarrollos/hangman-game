import { Component, OnInit } from '@angular/core';
import { IonHeader } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Theme } from 'src/app/models/game.model';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { ModalController } from '@ionic/angular';
import { IonRouterOutlet } from '@ionic/angular';
import { AdmobService } from 'src/app/services/admob.service';

@Component({
  selector: 'app-level',
  templateUrl: './level.component.html',
  styleUrls: ['./level.component.scss'],
  imports: [   CommonModule,
    FormsModule,
    IonicModule,
  ]
})
export class LevelComponent  implements OnInit {

 tematica: Theme = 'general';


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
  constructor(
    private admobService: AdmobService,
    private router: Router,
    private route: ActivatedRoute,
        private modalController: ModalController ,
      private routerOutlet: IonRouterOutlet

  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tematica = params['theme'] as Theme;
      this.admobService.showBannerBottomCenter();
    });
  }

  iniciarJuego(nivel: string): void {
    this.router.navigate(['/game', this.tematica, nivel]);
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
