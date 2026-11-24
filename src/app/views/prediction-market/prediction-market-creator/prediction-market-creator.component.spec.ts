import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionMarketCreatorComponent } from './prediction-market-creator.component';

describe('PredictionMarketCreatorComponent', () => {
  let component: PredictionMarketCreatorComponent;
  let fixture: ComponentFixture<PredictionMarketCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionMarketCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionMarketCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
