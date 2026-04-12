import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { SearchService } from '../../../core/services/search.service';
import { Product } from '../../../model/product.model';
import { CartService } from '../../../core/services/cart.service';
import { DataService } from '../../../core/services/data.service';
import { ProductSearchRequestDTO } from '../../../model/product-search-request-dto.model';
import { Province } from '../../../model/province.model';
import { Municipality } from '../../../model/muncipality.model'

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { User } from '../../../model/user.model';
import { isPlatformBrowser } from '@angular/common';
import { Page } from '../../../model/page.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap, tap, catchError, of } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { untracked } from '@angular/core';

@Component({
  selector: 'app-ecommerce-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ecommerce-dashboard.component.html',
  styleUrl: './ecommerce-dashboard.component.scss',
})
export class EcommerceDashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private searchService = inject(SearchService);
  private cartService = inject(CartService);
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);
  public loggedInUser: User | undefined;

  private platformId = inject(PLATFORM_ID);

  viewMode: 'grid' | 'list' = 'grid';

  // State
  private allProducts = signal<Product[]>([]);
  searchQuery = signal<string>('');

  // Location Data
  public provinces: Province[] = [];
  public allMunicipalities: Municipality[] = [];
  public filteredMunicipalities: Municipality[] = [];

  // Form
  searchForm: FormGroup = this.fb.group({
    provinceId: [null],
    municipalityId: [null]
  });

  pageSize = signal(10);
  currentPage = signal(0);
  loading = signal(false);
  private searchTrigger = signal(0);
  error = signal<string | null>(null);

  private searchParams = computed(() => {
    this.searchTrigger(); // Dependency: triggers re-evaluation on performSearch()

    const page = this.currentPage();
    const size = this.pageSize();
    const formValues = this.searchForm.getRawValue();
    const currentQuery = untracked(() => this.searchQuery());

    return {
      request: {
        userMunicipalityId: this.loggedInUser?.municipalityId || null,
        userProvinceId: this.loggedInUser?.provinceId || null,
        selectedProvinceId: formValues.provinceId,
        selectedMunicipalityId: formValues.municipalityId,
        categoryIds: [],
        // Include the search text from your signal
        searchQuery: currentQuery
      } as ProductSearchRequestDTO,
      page,
      size
    };
  });

  // 3. The Reactive Resource
  private productsResource = toSignal(
    toObservable(this.searchParams).pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(({ request, page, size }) =>
        this.productsService.postSearchProducts(request, page, size).pipe(
          catchError((err) => {
            console.error(err);
            this.error.set('Failed to load products');
            return of(null);
          }),
          tap(() => this.loading.set(false))
        )
      )
    ),
    { initialValue: null }
  );

  // 4. Selectors for the Template
  // Replace your old 'filteredProducts' with this
  products = computed(() => this.productsResource()?.content ?? []);
  totalElements = computed(() => this.productsResource()?.totalElements ?? 0);

  // Helper to change page
  onPageChange(event: { pageIndex: number, pageSize: number }) {
    this.pageSize.set(event.pageSize);
    this.currentPage.set(event.pageIndex);
  }

  filteredProducts = computed(() => {
    // 1. React to the keystroke signal
    const query = this.searchQuery().toLowerCase();

    // 2. React to the API data signal
    const products = this.productsResource()?.content ?? [];

    if (!query) return products;

    // 3. Perform local filtering on the array
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    // Wrap logic that touches the DOM or Browser APIs
    if (isPlatformBrowser(this.platformId)) {
      this.loadLocationData();

      // Toolbar search listener should also be here
      this.searchService.searchQuery$.subscribe(query => this.searchQuery.set(query));
    }

    // This logic is safe for SSR because it's just setting up an observable stream
    this.searchForm.get('provinceId')?.valueChanges.subscribe(provId => {
      this.filteredMunicipalities = this.allMunicipalities.filter(m => m.provinceId === provId);
      this.searchForm.get('municipalityId')?.setValue(null);
    });

    this.performSearch();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  private loadLocationData() {
    // Check if we are in the browser before using localStorage
    if (isPlatformBrowser(this.platformId)) {
      const provJson = localStorage.getItem('PROVINCES');
      const muniJson = localStorage.getItem('MUNICIPALITIES');
      this.provinces = provJson ? JSON.parse(provJson) : [];
      this.allMunicipalities = muniJson ? JSON.parse(muniJson) : [];
    }
  }

  performSearch() {
    // 1. Refresh user data from localStorage (Standard practice for your app)
    if (isPlatformBrowser(this.platformId)) {
      const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');
      if (savedProfileJson) {
        this.loggedInUser = JSON.parse(savedProfileJson) as User;
      }
    }

    // 2. Reset pagination to the first page for a new search
    this.currentPage.set(0);

    // 3. Increment the trigger. 
    // Because searchParams() depends on this, the API call will fire.
    this.searchTrigger.update(v => v + 1);
  }

  addProduct(product: Product) {
    this.cartService.addToCart({
      productId: product.id!,
      name: product.name,
      providerId: product.providerId,
      unitPrice: product.price,
      quantity: 1,
      productImgUrl: product.productImageUrl!,
    });
  }
  onSearchChange(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchService.updateSearch(filterValue);
  }
}