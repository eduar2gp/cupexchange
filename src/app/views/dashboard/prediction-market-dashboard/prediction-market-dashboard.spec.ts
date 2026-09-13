import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionMarketDashboard } from './prediction-market-dashboard';

describe('PredictionMarketDashboard', () => {
  let component: PredictionMarketDashboard;
  let fixture: ComponentFixture<PredictionMarketDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionMarketDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionMarketDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
