import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderOrderDetailsComponent } from './provider-order-details.component';

describe('ProviderOrderDetailsComponent', () => {
  let component: ProviderOrderDetailsComponent;
  let fixture: ComponentFixture<ProviderOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderOrderDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
