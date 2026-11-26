import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionMarketSettlementComponent } from './prediction-market-settlement.component';

describe('PredictionMarketSettlementComponent', () => {
  let component: PredictionMarketSettlementComponent;
  let fixture: ComponentFixture<PredictionMarketSettlementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionMarketSettlementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionMarketSettlementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
