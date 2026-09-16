import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPredictionOrder } from './add-prediction-order';

describe('AddPredictionOrder', () => {
  let component: AddPredictionOrder;
  let fixture: ComponentFixture<AddPredictionOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPredictionOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPredictionOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
