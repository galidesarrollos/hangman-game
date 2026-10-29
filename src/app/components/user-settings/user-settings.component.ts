import { Component, inject } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StatsService } from 'src/app/services/stats.service';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { openSettingsModal } from 'src/app/services/settings-modal';
import { AdmobService } from 'src/app/services/admob.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent {
  readonly estadisticas = inject(StatsService).getStats();
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);
  readonly admobService = inject(AdmobService);
  changingPrivacyOptions = false;

  async openVolumeSettings(): Promise<void> {
    await openSettingsModal(this.modalController, VolumeSidebarComponent, 'volume-sidebar-modal');
  }

  async openPrivacyOptions(): Promise<void> {
    if (this.changingPrivacyOptions) return;
    this.changingPrivacyOptions = true;
    try {
      await this.admobService.showPrivacyOptions();
    } catch (error) {
      console.warn('No se han podido abrir las opciones de privacidad:', error);
      const aviso = await this.toastController.create({ message: 'No se pudieron abrir los ajustes de anuncios. Inténtalo de nuevo.', duration: 3000, position: 'top' });
      await aviso.present();
    } finally {
      this.changingPrivacyOptions = false;
    }
  }

  close(): void { void this.modalController.dismiss(); }
}
