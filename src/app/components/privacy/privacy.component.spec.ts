import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent, IonicModule.forRoot()]
    }).overrideComponent(PrivacyComponent, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
  });

  it('creates the privacy screen', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
