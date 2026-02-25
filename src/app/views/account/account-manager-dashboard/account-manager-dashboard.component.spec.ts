import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountManagerDashboardComponent } from './account-manager-dashboard.component';

describe('AccountManagerDashboardComponent', () => {
  let component: AccountManagerDashboardComponent;
  let fixture: ComponentFixture<AccountManagerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountManagerDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountManagerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
