import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcommerceOrdersListComponent } from './ecommerce-orders-list.component';

describe('EcommerceOrdersListComponent', () => {
  let component: EcommerceOrdersListComponent;
  let fixture: ComponentFixture<EcommerceOrdersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceOrdersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcommerceOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
