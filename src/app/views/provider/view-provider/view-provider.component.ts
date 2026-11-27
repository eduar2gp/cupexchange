import { DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, take } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Provider } from '../../../model/provider.model';
import { ProvidersService } from '../../../core/services/providers.service';
import { Product, ProductReviewResponse } from '../../../model/product.model';
import { Page } from '../../../model/page.model';
import { DataService } from '../../../core/services/data.service';
import { ProductsService } from '../../../../app/core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
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
import { User } from '../../../model/user.model';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
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
  private readonly cartService = inject(CartService);
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
  loggedInUser: User | null = null;
  userMunicipalityId: number | null = null;
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
    this.loadLoggedInUser();
    this.loadCategories();
    this.bindFilters();
    this.loadProviderData();
  }

  private loadLoggedInUser(): void {
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');
    if (!savedProfileJson) {
      this.loggedInUser = null;
      this.userMunicipalityId = null;
      return;
    }

    try {
      this.loggedInUser = JSON.parse(savedProfileJson) as User;
      this.userMunicipalityId = typeof this.loggedInUser.municipalityId === 'number'
        ? this.loggedInUser.municipalityId
        : null;
    } catch (err) {
      console.error('Failed to parse USER_PROFILE_DATA', err);
      this.loggedInUser = null;
      this.userMunicipalityId = null;
    }
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

        return forkJoin({
          provider: this.providersService.getProviderById(providerId.toString()),
          coverage: this.providersService.getProviderCoverage(providerId).pipe(
            catchError(() => of({
              providerId,
              providerName: '',
              activeMunicipalities: [],
            } as ProviderCoveragePayload))
          )
        }).pipe(
          take(1),
          map(({ provider, coverage }) => ({ provider, coverage, providerId }))
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
      const responseWithAvailability = this.applyCoverageAvailability(normalizedResponse);

      this.updateViewState(() => {
        this.products = responseWithAvailability;
        this.currentPage = responseWithAvailability.page.number;
        this.pageSize = responseWithAvailability.page.size;
        this.applyFilters();
      });
    });
  }

  private applyCoverageAvailability(response: ProductReviewResponse<Product>): ProductReviewResponse<Product> {
    if (this.userMunicipalityId === null || this.userMunicipalityId === undefined) {
      return response;
    }

    const coverage = this.providerCoverage();
    const isMunicipalityActive = !!coverage?.activeMunicipalities?.some(
      municipality => municipality.id === this.userMunicipalityId
    );

    return {
      ...response,
      content: (response.content ?? []).map((product) => ({
        ...product,
        available: isMunicipalityActive ? true : false,
      })),
    };
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
  return combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(
    take(1),
    map(([params, queryParams]) => {
      const fromRoute = Number(params.get('id'));
      if (!Number.isNaN(fromRoute) && fromRoute > 0) {
        return fromRoute;
      }

      const fromQuery = Number(queryParams.get('providerId'));
      if (!Number.isNaN(fromQuery) && fromQuery > 0) {
        return fromQuery;
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

  addProduct(product: Product): void {
    if (!product.id || product.available === false) {
      return;
    }

    this.cartService.addToCart({
      productId: product.id,
      description: product.description || '',
      name: product.name,
      providerId: product.providerId,
      providerName: product.providerName,
      currencyCode: this.getProductCurrency(product),
      unitPrice: this.getProductPrice(product),
      quantity: 1,
      productImgUrl: product.productImageUrl || '',
    });
  }

}
