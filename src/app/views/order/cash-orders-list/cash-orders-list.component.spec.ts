import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashOrdersListComponent } from './cash-orders-list.component';

describe('CashOrdersListComponent', () => {
  let component: CashOrdersListComponent;
  let fixture: ComponentFixture<CashOrdersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashOrdersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
