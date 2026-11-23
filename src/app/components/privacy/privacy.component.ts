import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonContent, RouterLink]
})
export class PrivacyComponent {
  irA(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
