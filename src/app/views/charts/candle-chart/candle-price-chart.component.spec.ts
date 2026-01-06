import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandlePriceChartComponent } from './candle-price-chart.component';

describe('CandlePriceChartComponent', () => {
  let component: CandlePriceChartComponent;
  let fixture: ComponentFixture<CandlePriceChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandlePriceChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandlePriceChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
