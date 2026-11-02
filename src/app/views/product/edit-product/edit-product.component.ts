import { Component, inject, OnInit, signal } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { map, Observable } from 'rxjs';
import { Product, ProductPrice } from '../../../model/product.model';
import { Provider } from '../../../model/provider.model';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../model/category.model';
import { MatSelectModule } from '@angular/material/select';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [AsyncPipe, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, MatIconModule, MatCardModule, MatDividerModule],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss'
})
export class EditProductComponent implements OnInit {
  
  productData$!: Observable<Product | null>; 
  providerData$!: Observable<Provider | null>;
  selectedFile: File | null = null;
  readonly categories = signal<Category[]>([]);

  private productsService = inject(ProductsService);
  private categoryService = inject(CategoryService);

  constructor(private dataService: DataService) {
    this.productData$ = this.dataService.currentProduct.pipe(
      map(product => product ? {
        ...product,
        category_id: product.category_id ?? product.categories?.map(category => category.id).filter((id): id is number => id !== undefined) ?? []
      } : null)
    );
    this.providerData$ = this.dataService.currentProvider;
  }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories', error)
    });
  }

  addPrice(product: Product): void {
    product.prices = [...(product.prices ?? []), { currencyCode: 'USD', price: 0.01 }];
  }

  removePrice(product: Product, index: number): void {
    product.prices = product.prices?.filter((_, priceIndex) => priceIndex !== index) ?? [];
  }

  onCategorySelectionChange(product: Product, categoryIds: number[]): void {
    product.category_id = categoryIds;
    product.categories = this.categories().filter(category =>
      category.id !== undefined && categoryIds.includes(category.id)
    );
  }

  // Method to capture the selected file
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('file selected')
    }
  }

  // Method called when the form is submitted
  saveProduct(product: Product): void {
    const payload: Product = {
      name: product.name.trim(),
      providerId: product.providerId,
      stockQuantity: Number(product.stockQuantity),
      category_id: product.category_id ?? product.categories?.map(category => category.id).filter((id): id is number => id !== undefined) ?? [],
      prices: (product.prices ?? []).map((item: ProductPrice) => ({
        currencyCode: item.currencyCode.trim().toUpperCase(),
        price: Number(item.price)
      })),
      description: product.description
    };

    console.log('Submitting product:', payload);
    // 1. Call the service method with a PriceDTO-compatible prices array.
    this.productsService.updateProduct(product.id!, payload)
      // 2. Subscribe to the Observable to trigger the HTTP request and handle the result.
      .subscribe({
        next: (updatedProduct: Product) => {
          // This runs if the PUT request is successful (HTTP 200/204)
          console.log('Product updated successfully:', updatedProduct);
          //alert(`Product ${updatedProduct.name} updated!`);
          // Optional: Perform additional actions like refreshing the list or navigating.
        
          if (this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile, this.selectedFile.name);
            this.productsService.saveProductWithImage(product.id!, formData).subscribe({
              next: (updatedProduct: any) => {
                console.log('Product image saved successfully!', updatedProduct);
                // Handle success (e.g., navigate, show notification)
              },
              error: (err: any) => {
                console.error('Error saving product:', err);
                // Handle error
              }
            });
          }

        },
        error: (error: any) => {
          // This runs if the PUT request fails (e.g., HTTP 4xx or 5xx)
          console.error('Error updating product:', error);
          alert('Failed to save product. Check the console for details.');
          // Optional: Display a user-friendly error message.
        },
        complete: () => {
          // This runs when the Observable completes (after next or error)
          console.log('Product update stream finished.');
        }
      });    
  }
}
