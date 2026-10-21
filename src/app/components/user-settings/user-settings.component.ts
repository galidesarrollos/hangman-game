import { Component, inject } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StatsService } from 'src/app/services/stats.service';
import { VolumeSidebarComponent } from '../volume-sidebar/volume-sidebar.component';
import { openSettingsModal } from 'src/app/services/settings-modal';

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

  async openVolumeSettings(): Promise<void> {
    await openSettingsModal(this.modalController, VolumeSidebarComponent, 'volume-sidebar-modal');
  }

  close(): void { void this.modalController.dismiss(); }
}
