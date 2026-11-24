import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPredictionEventComponent } from './add-prediction-event.component';

describe('AddPredictionEventComponent', () => {
  let component: AddPredictionEventComponent;
  let fixture: ComponentFixture<AddPredictionEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPredictionEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPredictionEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
