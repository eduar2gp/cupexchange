import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcommerceOrderDetailsComponent } from './ecommerce-order-details.component';

describe('EcommerceOrderDetailsComponent', () => {
  let component: EcommerceOrderDetailsComponent;
  let fixture: ComponentFixture<EcommerceOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceOrderDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcommerceOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
