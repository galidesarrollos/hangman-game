import { Component, inject, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AudioService } from 'src/app/services/audio.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Sounds } from 'src/app/models/game.model';

@Component({
  selector: 'app-volume-sidebar',
  templateUrl: './volume-sidebar.component.html',
  styleUrls: ['./volume-sidebar.component.scss'],
  imports: [IonicModule, CommonModule]
})
export class VolumeSidebarComponent implements OnInit {
  readonly audioService = inject(AudioService);
  private readonly modalController = inject(ModalController);

  volume = 100;
  private lastAudibleVolume = 100;

  ngOnInit(): void {
    this.volume = Math.round(this.audioService.getVolume() * 100);
    if (this.volume > 0) this.lastAudibleVolume = this.volume;
  }

  onVolumeChange(event: CustomEvent): void {
    this.volume = Math.max(0, Math.min(100, Number(event.detail.value)));
    if (this.volume > 0) this.lastAudibleVolume = this.volume;
    this.audioService.setVolume(this.volume / 100);
  }

  toggleMute(): void {
    if (this.volume > 0) {
      this.lastAudibleVolume = this.volume;
      this.volume = 0;
    } else {
      this.volume = this.lastAudibleVolume;
    }
    this.audioService.setVolume(this.volume / 100);
  }

  playPreview(sound: Sounds): void {
    this.audioService.playSound(sound);
  }

  close(): void {
    void this.modalController.dismiss();
  }

  volumeFormatter(value: number): string {
    return `${value}%`;
  }
}
