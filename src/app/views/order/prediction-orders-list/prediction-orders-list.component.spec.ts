import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionOrdersListComponent } from './prediction-orders-list.component';

describe('PredictionOrdersListComponent', () => {
  let component: PredictionOrdersListComponent;
  let fixture: ComponentFixture<PredictionOrdersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionOrdersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
