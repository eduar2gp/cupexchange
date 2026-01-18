import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderOrdersListComponent } from './provider-orders-list.component';

describe('ProviderOrdersListComponent', () => {
  let component: ProviderOrdersListComponent;
  let fixture: ComponentFixture<ProviderOrdersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderOrdersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
