import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DataService } from '../../../core/services/data.service';
import { ProductsService } from '../../../core/services/products.service';
import { ViewProductReviewComponent } from './view-product-review.component';

describe('ViewProductReviewComponent', () => {
  let component: ViewProductReviewComponent;
  let fixture: ComponentFixture<ViewProductReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewProductReviewComponent],
      providers: [
        { provide: DataService, useValue: { currentProduct: of(null) } },
        { provide: ProductsService, useValue: { getProductReviews: () => of({ content: [], page: {} }) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewProductReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
