import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, finalize, map, switchMap, take } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Provider } from '../../../model/provider.model';
import { ProvidersService } from '../../../core/services/providers.service';
import { Product, ProductReviewResponse } from '../../../model/product.model';
import { Page } from '../../../model/page.model';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ProviderCoveragePayload } from '../../../model/provider-coverage-response.model';

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
    MatChipsModule,
    MatPaginatorModule,
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
  products: ProductReviewResponse<Product> = {
    content: [],
    page: {
      size: 10,
      number: 0,
      totalElements: 0,
      totalPages: 0,
    },
  };
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  providerCoverage = signal<ProviderCoveragePayload | undefined>(undefined);
  currentPage = 0;
  pageSize = 10;
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
      this.products = {
        content: [],
        page: {
          size: this.pageSize,
          number: this.currentPage,
          totalElements: 0,
          totalPages: 0,
        },
      };
      this.filteredProducts = [];
      this.providerCoverage.set(undefined);
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
          this.providersService.getProviderCoverage(providerId).pipe(
            catchError(() => of({
              providerId,
              providerName: '',
              activeMunicipalities: [],
            } as ProviderCoveragePayload))
          )
        ]).pipe(
          take(1),
          map(([provider, coverage]) => ({ provider, coverage, providerId }))
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
        this.providerCoverage.set(result.coverage);
      });

      this.loadProductsPage(result.providerId, this.currentPage, this.pageSize);
    });
  }

  onProductsPageChange(event: PageEvent): void {
    const providerId = this.provider?.id;
    if (!providerId) {
      return;
    }

    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProductsPage(providerId, this.currentPage, this.pageSize);
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

    const sourceProducts = Array.isArray(this.products?.content) ? this.products.content : [];

    const results = sourceProducts.filter((product) => {
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

  private loadProductsPage(providerId: number, page: number, size: number): void {
    this.updateViewState(() => {
      this.filtering = true;
    });

    this.productsService.getProductsByProvider(providerId, page, size).pipe(
      take(1),
      catchError((err) => {
        console.error('Failed to load provider products', err);
        return of({
          content: [],
          page: {
            size,
            number: page,
            totalElements: 0,
            totalPages: 0,
          },
        } as ProductReviewResponse<Product>);
      })
    ).subscribe((productsResponse) => {
      const normalizedResponse = this.normalizeProductsResponse(productsResponse, page, size);

      this.updateViewState(() => {
        this.products = normalizedResponse;
        this.currentPage = normalizedResponse.page.number;
        this.pageSize = normalizedResponse.page.size;
        this.applyFilters();
      });
    });
  }

  private normalizeProductsResponse(
    response: ProductReviewResponse<Product> | Page<Product> | Product[],
    fallbackPage: number,
    fallbackSize: number,
  ): ProductReviewResponse<Product> {
    if (Array.isArray(response)) {
      return {
        content: response,
        page: {
          size: fallbackSize,
          number: fallbackPage,
          totalElements: response.length,
          totalPages: response.length > 0 ? 1 : 0,
        },
      };
    }

    const maybePaged = response as Page<Product>;
    if (Array.isArray(maybePaged.content) && typeof maybePaged.totalElements === 'number') {
      return {
        content: maybePaged.content,
        page: {
          size: maybePaged.size ?? fallbackSize,
          number: maybePaged.number ?? fallbackPage,
          totalElements: maybePaged.totalElements ?? maybePaged.content.length,
          totalPages: maybePaged.totalPages ?? 0,
        },
      };
    }

    const maybeReviewShape = response as ProductReviewResponse<Product>;
    return {
      content: Array.isArray(maybeReviewShape.content) ? maybeReviewShape.content : [],
      page: {
        size: maybeReviewShape.page?.size ?? fallbackSize,
        number: maybeReviewShape.page?.number ?? fallbackPage,
        totalElements: maybeReviewShape.page?.totalElements ?? (maybeReviewShape.content?.length ?? 0),
        totalPages: maybeReviewShape.page?.totalPages ?? 0,
      },
    };
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
