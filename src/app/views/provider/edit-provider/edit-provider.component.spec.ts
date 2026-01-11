import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProviderComponent } from './edit-provider.component';

describe('EditProviderComponent', () => {
  let component: EditProviderComponent;
  let fixture: ComponentFixture<EditProviderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProviderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
