import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, finalize, takeUntil } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { ProductsService } from '../../../core/services/products.service';

@Component({
  selector: 'app-add-product-review',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-product-review.component.html',
  styleUrl: './add-product-review.component.scss',
})
export class AddProductReviewComponent implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly dataService = inject(DataService);
  private readonly destroy$ = new Subject<void>();

  @Output() readonly reviewSubmitted = new EventEmitter<void>();

  readonly ratingStars = [1, 2, 3, 4, 5];

  readonly reviewForm = new FormGroup({
    rating: new FormControl<number>(5, {
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
      nonNullable: true
    }),
    comment: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(800)],
      nonNullable: true
    })
  });

  productId: number | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';
  hoverRating = 0;

  ngOnInit(): void {
    this.dataService.currentProduct
      .pipe(takeUntil(this.destroy$))
      .subscribe(product => {
        this.productId = product?.id ?? null;
        this.errorMessage = '';
        this.successMessage = '';
      });
  }

  selectRating(rating: number): void {
    this.reviewForm.controls.rating.setValue(rating);
    this.reviewForm.controls.rating.markAsTouched();
  }

  submitReview(): void {
    this.reviewForm.markAllAsTouched();

    if (this.loading || this.reviewForm.invalid || this.productId === null) {
      return;
    }

    const { rating, comment } = this.reviewForm.getRawValue();

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.productsService.postProductReview(this.productId, {
      rating,
      comment: comment.trim()
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Review submitted successfully.';
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.reviewSubmitted.emit();
        },
        error: () => {
          this.errorMessage = 'Unable to submit your review right now. Please try again.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
