import { Component, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { SearchService } from '../../../core/services/search.service';
import { Product } from '../../../model/product.model';
import { CartService } from '../../../core/services/cart.service';
import { DataService } from '../../../core/services/data.service';
import { ProductSearchRequestDTO } from '../../../model/product-search-request-dto.model';
import { Province  } from '../../../model/province.model';
import { Municipality } from '../../../model/muncipality.model'

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../../../model/user.model';

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
    MatInputModule
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

  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allProducts().filter(product =>
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
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');
    if (savedProfileJson) {
      this.loggedInUser = JSON.parse(savedProfileJson) as User;
    }
    const formValues = this.searchForm.value;

    const request: ProductSearchRequestDTO = {
      // User's home location (for availability flag)
      userMunicipalityId: this.loggedInUser?.municipalityId || null,
      userProvinceId: this.loggedInUser?.provinceId || null,

      // Filter selection
      selectedProvinceId: formValues.provinceId,
      selectedMunicipalityId: formValues.municipalityId,

      categoryIds: [] // Can be linked to a category selector later
    };

    this.productsService.postSearchProducts(request, 0, 50).subscribe(page => {
      // Assuming getProducts returns Page<Product>, we extract the content array
      this.allProducts.set(page.content);
    });
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
