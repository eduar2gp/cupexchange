import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionalBalanceComponent } from './regional-balance.component';

describe('RegionalBalanceComponent', () => {
  let component: RegionalBalanceComponent;
  let fixture: ComponentFixture<RegionalBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionalBalanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegionalBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
