import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProviderComponentTs } from './add-provider.component.ts';

describe('AddProviderComponentTs', () => {
  let component: AddProviderComponentTs;
  let fixture: ComponentFixture<AddProviderComponentTs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProviderComponentTs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddProviderComponentTs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
