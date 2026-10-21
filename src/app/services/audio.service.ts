import { Injectable } from '@angular/core';
import { Sounds } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private volume = 1;
  private lastAudibleVolume = 1;

  private audios: { [key in Sounds]: HTMLAudioElement } = {
    acierto: new Audio('assets/sounds/acierto.mp3'),
    error: new Audio('assets/sounds/error.mp3'),
    victoria: new Audio('assets/sounds/victoria.mp3'),
    derrota: new Audio('assets/sounds/derrota.mp3')
  };

  constructor() {
    const savedVolume = localStorage.getItem('gameVolume');
    if (savedVolume !== null) {
      const percent = Number(savedVolume);
      if (Number.isFinite(percent)) this.volume = Math.max(0, Math.min(100, percent)) / 100;
    }
    if (this.volume > 0) this.lastAudibleVolume = this.volume;
    Object.values(this.audios).forEach((audioElement: HTMLAudioElement) => {
      audioElement.load();
    });
  }

  setVolume(level: number): void {
    this.volume = Math.max(0, Math.min(1, level));
    if (this.volume > 0) this.lastAudibleVolume = this.volume;
    localStorage.setItem('gameVolume', String(Math.round(this.volume * 100)));
  }

  getVolume(): number {
    return this.volume;
  }

  toggleMute(): void {
    this.setVolume(this.volume > 0 ? 0 : this.lastAudibleVolume);
  }

  public playSound(sound: Sounds): void {
    const audio = this.audios[sound];
    audio.volume = this.volume;
    audio.currentTime = 0;
    audio.play().catch(error => console.log(`Error playing ${sound} sound:`, error));
  }
}
