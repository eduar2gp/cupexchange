import { Component, inject, OnInit, signal } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { map, Observable } from 'rxjs';
import { Product, ProductImage, ProductPrice } from '../../../model/product.model';
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
  selectedFiles: File[] = [];
  readonly categories = signal<Category[]>([]);

  private productsService = inject(ProductsService);
  private categoryService = inject(CategoryService);

  constructor(private dataService: DataService) {
    this.productData$ = this.dataService.currentProduct.pipe(
      map(product => product ? this.normalizeProduct(product) : null)
    );
    this.providerData$ = this.dataService.currentProvider;
  }

  private normalizeProduct(product: Product): Product {
    const images = this.normalizeImages(product.images, product.productImageUrl);

    return {
      ...product,
      category_id: product.category_id ?? product.categories?.map(category => category.id).filter((id): id is number => id !== undefined) ?? [],
      images,
      productImageUrl: images.find(image => image.isPrimary)?.imageUrl ?? product.productImageUrl
    };
  }

  private normalizeImages(images: ProductImage[] | undefined, fallbackImageUrl?: string): ProductImage[] {
    const source = images?.length
      ? images
      : (fallbackImageUrl
        ? [{ id: null, imageUrl: fallbackImageUrl, altText: null, displayOrder: 0, isPrimary: true }]
        : []);

    const hasPrimary = source.some(image => image.isPrimary);

    return source
      .filter(image => !!image.imageUrl)
      .map((image, index) => ({
        ...image,
        displayOrder: index,
        isPrimary: hasPrimary ? !!image.isPrimary : index === 0
      }));
  }

  getPrimaryImageUrl(product: Product): string {
    return product.images?.find(image => image.isPrimary)?.imageUrl
      ?? product.productImageUrl
      ?? 'assets/placeholder.png';
  }

  setPrimaryImage(product: Product, index: number): void {
    const images = product.images ?? [];
    product.images = images.map((image, imageIndex) => ({
      ...image,
      isPrimary: imageIndex === index,
      displayOrder: imageIndex
    }));
    product.productImageUrl = product.images[index]?.imageUrl;
  }

  removeImage(product: Product, index: number): void {
    const remainingImages = (product.images ?? []).filter((_, imageIndex) => imageIndex !== index);
    if (remainingImages.length === 0) {
      product.images = [];
      product.productImageUrl = undefined;
      return;
    }

    const hasPrimary = remainingImages.some(image => image.isPrimary);
    product.images = remainingImages.map((image, imageIndex) => ({
      ...image,
      displayOrder: imageIndex,
      isPrimary: hasPrimary ? image.isPrimary : imageIndex === 0
    }));
    product.productImageUrl = product.images.find(image => image.isPrimary)?.imageUrl;
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

  // Method to capture the selected files
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = Array.from(input.files ?? []);
    if (this.selectedFiles.length > 0) {
      console.log('files selected:', this.selectedFiles.length);
    }
  }

  // Method called when the form is submitted
  saveProduct(product: Product): void {
    const normalizedImages = this.normalizeImages(product.images, product.productImageUrl);
    const primaryImageUrl = normalizedImages.find(image => image.isPrimary)?.imageUrl;

    const payload: Product = {
      name: product.name.trim(),
      providerId: product.providerId,
      stockQuantity: Number(product.stockQuantity),
      category_id: product.category_id ?? product.categories?.map(category => category.id).filter((id): id is number => id !== undefined) ?? [],
      prices: (product.prices ?? []).map((item: ProductPrice) => ({
        currencyCode: item.currencyCode.trim().toUpperCase(),
        price: Number(item.price)
      })),
      description: product.description,
      images: normalizedImages,
      productImageUrl: primaryImageUrl
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
        
          if (this.selectedFiles.length > 0) {
            const formData = new FormData();
            this.selectedFiles.forEach((file) => {
              formData.append('files', file, file.name);
            });
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
