import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPredictionMarketComponent } from './add-prediction-market.component';

describe('AddPredictionMarketComponent', () => {
  let component: AddPredictionMarketComponent;
  let fixture: ComponentFixture<AddPredictionMarketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPredictionMarketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPredictionMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
