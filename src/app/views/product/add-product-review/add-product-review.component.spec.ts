import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DataService } from '../../../core/services/data.service';
import { ProductsService } from '../../../core/services/products.service';
import { AddProductReviewComponent } from './add-product-review.component';

describe('AddProductReviewComponent', () => {
  let component: AddProductReviewComponent;
  let fixture: ComponentFixture<AddProductReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProductReviewComponent],
      providers: [
        { provide: DataService, useValue: { currentProduct: of(null) } },
        { provide: ProductsService, useValue: { postProductReview: () => of({}) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddProductReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
