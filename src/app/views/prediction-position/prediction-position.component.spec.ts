import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PredictionPositionComponent } from './prediction-position.component';

describe('PredictionPositionComponent', () => {
  let component: PredictionPositionComponent;
  let fixture: ComponentFixture<PredictionPositionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionPositionComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionPositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
