import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../../core/services/products.service';
import { SearchService } from '../../../core/services/search.service'; // Assuming this path
import { Product } from '../../../model/product.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-ecommerce-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './ecommerce-dashboard.component.html',
  styleUrl: './ecommerce-dashboard.component.scss',
})
export class EcommerceDashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private searchService = inject(SearchService);
  private cartService = inject(CartService);

  // State
  private allProducts = signal<Product[]>([]);
  searchQuery = signal<string>('');

  // Computed signal to filter products automatically when list or query changes
  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allProducts().filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    // 1. Fetch initial products
    this.productsService.getProducts().subscribe(products => {
      this.allProducts.set(products);
    });

    // 2. Listen for search updates from the toolbar
    this.searchService.searchQuery$.subscribe(query => {
      this.searchQuery.set(query);
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

}
