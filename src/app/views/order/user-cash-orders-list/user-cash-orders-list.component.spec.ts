import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCashOrdersListComponent } from './user-cash-orders-list.component';

describe('UserCashOrdersListComponent', () => {
  let component: UserCashOrdersListComponent;
  let fixture: ComponentFixture<UserCashOrdersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCashOrdersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCashOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
