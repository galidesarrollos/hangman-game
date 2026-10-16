import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { AudioService } from '../../services/audio.service';

import { VolumeSidebarComponent } from './volume-sidebar.component';

describe('VolumeSidebarComponent', () => {
  let component: VolumeSidebarComponent;
  let fixture: ComponentFixture<VolumeSidebarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [VolumeSidebarComponent, IonicModule.forRoot()],
      providers: [
        { provide: AudioService, useValue: { getVolume: () => 1 } },
        { provide: ModalController, useValue: {} }
      ]
    }).overrideComponent(VolumeSidebarComponent, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(VolumeSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
