import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { ProductsService } from '../../../core/services/products.service';
import { ProductReviewResponse } from '../../../model/product.model';

@Component({
  selector: 'app-view-product-review',
  imports: [DatePipe, MatCardModule, MatIconModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './view-product-review.component.html',
  styleUrl: './view-product-review.component.scss',
})
export class ViewProductReviewComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly productsService = inject(ProductsService);
  private readonly ngZone = inject(NgZone);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly ratingStars = [1, 2, 3, 4, 5];
  productId: number | null = null;
  reviews: ProductReviewResponse | null = null;
  pageIndex = 0;
  pageSize = 5;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.dataService.currentProduct
      .pipe(takeUntil(this.destroy$))
      .subscribe(product => {
        const productId = product?.id ?? null;

        if (productId === this.productId) {
          return;
        }

        this.productId = productId;
        this.pageIndex = 0;
        this.loadReviews();
      });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadReviews();
  }

  trackReviewById(index: number, review: ProductReviewResponse['content'][number]): number {
    return review.id;
  }

  private loadReviews(): void {
    if (this.productId === null) {
      this.reviews = null;
      this.errorMessage = '';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productsService.getProductReviews(this.productId, this.pageIndex, this.pageSize)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.updateView(() => {
          this.loading = false;
        }))
      )
      .subscribe({
        next: reviews => this.updateView(() => {
          this.reviews = reviews;
        }),
        error: () => this.updateView(() => {
          this.reviews = null;
          this.errorMessage = 'Unable to load product reviews. Please try again.';
        })
      });
  }

  private updateView(update: () => void): void {
    this.ngZone.run(() => {
      update();
      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
