import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountProviderBillingReports } from './account-provider-billing-reports';

describe('AccountProviderBillingReports', () => {
  let component: AccountProviderBillingReports;
  let fixture: ComponentFixture<AccountProviderBillingReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProviderBillingReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountProviderBillingReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
