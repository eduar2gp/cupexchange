import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountProviderBalanceComponent } from './account-provider-balance.component';

describe('AccountProviderBalanceComponent', () => {
  let component: AccountProviderBalanceComponent;
  let fixture: ComponentFixture<AccountProviderBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProviderBalanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountProviderBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
