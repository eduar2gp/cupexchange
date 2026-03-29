import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderCashOrderDetailsComponent } from './provider-cash-order-details.component';

describe('ProviderCashOrderDetailsComponent', () => {
  let component: ProviderCashOrderDetailsComponent;
  let fixture: ComponentFixture<ProviderCashOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderCashOrderDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderCashOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
