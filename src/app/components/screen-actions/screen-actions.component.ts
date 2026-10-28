import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonRouterOutlet, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AudioService } from 'src/app/services/audio.service';
import { openSettingsModal } from 'src/app/services/settings-modal';
import { UserSettingsComponent } from '../user-settings/user-settings.component';

@Component({
  selector: 'app-screen-actions',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './screen-actions.component.html',
  styleUrls: ['./screen-actions.component.scss']
})
export class ScreenActionsComponent {
  private readonly router = inject(Router);
  private readonly audioService = inject(AudioService);
  private readonly modalController = inject(ModalController);
  private readonly routerOutlet = inject(IonRouterOutlet);

  @Input() backUrl?: string | any[];
  @Input() backLabel = 'Volver';
  @Input() showHome = false;
  @Input() showSound = true;
  @Input() showProfile = true;

  get isMuted(): boolean { return this.audioService.getVolume() === 0; }
  navigateBack(): void { if (this.backUrl) void this.router.navigate(Array.isArray(this.backUrl) ? this.backUrl : [this.backUrl]); }
  navigateHome(): void { void this.router.navigate(['/']); }
  toggleMute(): void { this.audioService.toggleMute(); }
  async openUserSettings(): Promise<void> {
    await openSettingsModal(this.modalController, UserSettingsComponent, 'user-settings-modal', this.routerOutlet.nativeEl);
  }
}
