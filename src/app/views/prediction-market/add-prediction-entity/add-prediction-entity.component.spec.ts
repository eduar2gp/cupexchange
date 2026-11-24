import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPredictionEntityComponent } from './add-prediction-entity.component';

describe('AddPredictionEntityComponent', () => {
  let component: AddPredictionEntityComponent;
  let fixture: ComponentFixture<AddPredictionEntityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPredictionEntityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPredictionEntityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
