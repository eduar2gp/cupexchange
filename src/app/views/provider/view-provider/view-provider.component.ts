import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, finalize, map, switchMap, take } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Provider } from '../../../model/provider.model';
import { ProvidersService } from '../../../core/services/providers.service';
import { Product } from '../../../model/product.model';
import { DataService } from '../../../core/services/data.service';
import { ProductsService } from '../../../../app/core/services/products.service';
import { Category } from '../../../model/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-provider.component',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
  ],
  templateUrl: './view-provider.component.html',
  styleUrl: './view-provider.component.scss',
})
export class ViewProviderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly providersService = inject(ProvidersService);
  private readonly productsService = inject(ProductsService);
  private readonly categoryService = inject(CategoryService);
  private readonly dataService = inject(DataService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private router = inject(Router);

  provider: Provider | null = null;
  readonly ratingStars = [1, 2, 3, 4, 5];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  loading = true;
  filtering = false;
  error: string | null = null;

  searchForm = this.fb.group({
    searchQuery: [''],
    categoryIds: [[] as number[]],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.bindFilters();
    this.loadProviderData();
  }

  private loadProviderData(): void {
    this.updateViewState(() => {
      this.loading = true;
      this.error = null;
      this.provider = null;
      this.products = [];
    });

    this.resolveProviderId().pipe(
      switchMap((providerId) => {
        if (!providerId) {
          this.updateViewState(() => {
            this.error = 'Provider ID was not provided.';
          });
          return of(null);
        }

        return combineLatest([
          this.providersService.getProviderById(providerId.toString()),
          this.productsService.getProductsByProvider(providerId)
        ]).pipe(
          take(1),
          map(([provider, products]) => ({ provider, products }))
        );
      }),
      catchError((err) => {
        console.error('Failed to load provider data', err);
        this.updateViewState(() => {
          this.error = 'Failed to load provider details. Please try again.';
        });
        return of(null);
      }),
      finalize(() => {
        this.updateViewState(() => {
          this.loading = false;
        });
      })
    ).subscribe((result) => {
      if (!result) {
        return;
      }

      this.updateViewState(() => {
        this.provider = result.provider;
        this.products = result.products ?? [];
        this.applyFilters();
      });
    });
  }

  performFilter(): void {
    this.applyFilters();
  }

  private bindFilters(): void {
    this.searchForm.valueChanges.subscribe(() => this.applyFilters());
  }

  private loadCategories(): void {
    this.categoryService.getCategories().pipe(take(1)).subscribe({
      next: (categories) => {
        this.updateViewState(() => {
          this.categories = categories ?? [];
        });
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  private applyFilters(): void {
    this.filtering = true;

    const { searchQuery, categoryIds } = this.searchForm.getRawValue();
    const query = (searchQuery ?? '').toLowerCase().trim();
    const selectedCategoryIds = (categoryIds ?? []) as number[];

    const results = this.products.filter((product) => {
      const matchesText = !query
        || product.name.toLowerCase().includes(query)
        || (product.description ?? '').toLowerCase().includes(query);

      const productCategoryIds = (product.categories ?? [])
        .map((category) => category.id)
        .filter((id): id is number => typeof id === 'number');

      const matchesCategory = selectedCategoryIds.length === 0
        || selectedCategoryIds.some((id) => productCategoryIds.includes(id));

      return matchesText && matchesCategory;
    });

    this.updateViewState(() => {
      this.filteredProducts = results;
      this.filtering = false;
    });
  }

  private updateViewState(update: () => void): void {
    this.ngZone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }

  private resolveProviderId() {
    return this.route.queryParamMap.pipe(
      take(1),
      map((queryParams) => {
        const fromQuery = Number(queryParams.get('providerId'));
        if (!Number.isNaN(fromQuery) && fromQuery > 0) {
          return fromQuery;
        }

        const fromRoute = Number(this.route.snapshot.paramMap.get('providerId'));
        if (!Number.isNaN(fromRoute) && fromRoute > 0) {
          return fromRoute;
        }

        return null;
      }),
      switchMap((providerId) => {
        if (providerId) {
          return of(providerId);
        }

        return this.dataService.currentProvider.pipe(
          take(1),
          map((provider) => provider?.id ?? null)
        );
      })
    );
  }

  getProductPrice(product: Product): number {
    if (product.price !== undefined && product.price !== null) {
      return product.price;
    }
    return product.prices?.[0]?.price ?? 0;
  }

  getProductCurrency(product: Product): string {
    return product.prices?.[0]?.currencyCode ?? 'USD';
  }

  viewProduct(product: Product): void {
    this.dataService.updateProduct(product);
    this.router.navigate(['/product-details']);
  }

}
