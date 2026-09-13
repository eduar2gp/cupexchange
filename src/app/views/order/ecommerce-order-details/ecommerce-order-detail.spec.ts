import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcommerceOrderDetail } from './ecommerce-order-detail';

describe('EcommerceOrderDetail', () => {
  let component: EcommerceOrderDetail;
  let fixture: ComponentFixture<EcommerceOrderDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceOrderDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcommerceOrderDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
