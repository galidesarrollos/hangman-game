import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, Platform, ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdmobService } from 'src/app/services/admob.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';

export interface ThemeOption { id: string; nombre: string; icono: string; descripcion: string; }

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, IonicModule, AppFooterComponent],
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.scss']
})
export class ThemeSelectorComponent implements AfterViewInit, ViewWillEnter {
  readonly tematicas: ThemeOption[] = [
    { id: 'deportes', nombre: 'Deportes', icono: '⚽', descripcion: 'Palabras relacionadas con deportes' },
    { id: 'ciencia', nombre: 'Ciencia', icono: '🔬', descripcion: 'Términos científicos y naturales' },
    { id: 'infantil', nombre: 'Infantil', icono: '🎨', descripcion: 'Palabras divertidas para los más pequeños' },
    { id: 'general', nombre: 'General', icono: '📚', descripcion: 'Vocabulario general y cotidiano' },
    { id: 'animales', nombre: 'Animales', icono: '🐾', descripcion: 'Animales de todo el mundo' },
    { id: 'comida', nombre: 'Comida', icono: '🍓', descripcion: 'Ingredientes y platos para abrir el apetito' },
    { id: 'naturaleza', nombre: 'Naturaleza', icono: '🌿', descripcion: 'Paisajes, clima y vida natural' },
    { id: 'tecnologia', nombre: 'Tecnología', icono: '💻', descripcion: 'Objetos y conceptos digitales' }
  ];
  readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly admobService = inject(AdmobService);

  ionViewWillEnter(): void {
    if (this.platform.is('hybrid')) void this.admobService.showBannerBottomCenter();
  }

  ngAfterViewInit(): void {
    if (!this.platform.is('hybrid')) {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (error) {
        console.error('Error cargando los anuncios de categorías', error);
      }
    }
  }
  seleccionar(tematica: string): void { void this.router.navigate(['/level', tematica]); }
  volver(): void { void this.router.navigate(['/']); }
}
