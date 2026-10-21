import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, IonRouterOutlet, ModalController } from '@ionic/angular';
import { of } from 'rxjs';
import { AdmobService } from '../../services/admob.service';
import { AudioService } from '../../services/audio.service';
import { LevelComponent } from './level.component';

describe('LevelComponent', () => {
  let fixture: ComponentFixture<LevelComponent>;
  const router = jasmine.createSpyObj('Router', ['navigate']);
  const admob = jasmine.createSpyObj('AdmobService', ['showBannerBottomCenter']);

  beforeEach(async () => {
    router.navigate.calls.reset();
    admob.showBannerBottomCenter.calls.reset();
    await TestBed.configureTestingModule({
      imports: [LevelComponent, IonicModule.forRoot()],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { params: of({ theme: 'animales' }) } },
        { provide: AdmobService, useValue: admob },
        { provide: AudioService, useValue: { getVolume: () => 1 } },
        { provide: ModalController, useValue: {} },
        { provide: IonRouterOutlet, useValue: { nativeEl: document.createElement('div') } }
      ]
    }).overrideComponent(LevelComponent, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(LevelComponent);
    fixture.detectChanges();
  });

  it('loads the selected theme and requests the banner', () => {
    expect(fixture.componentInstance.tematica).toBe('animales');
    expect(fixture.componentInstance.temaActual.nombre).toBe('Animales');
    expect(admob.showBannerBottomCenter).toHaveBeenCalled();
  });

  it('returns to theme selection or home from the navigation controls', () => {
    fixture.componentInstance.volver();
    expect(router.navigate).toHaveBeenCalledWith(['/tematicas']);

    fixture.componentInstance.irAlInicio();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
