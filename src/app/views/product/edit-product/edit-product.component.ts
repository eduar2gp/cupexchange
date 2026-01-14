import { Component, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { Observable } from 'rxjs';
import { Product } from '../../../model/product.model';
import { Provider } from '../../../model/provider.model';
import { AsyncPipe } from '@angular/common';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // 👈 Import HttpClient
import { ProductsService } from '../../../core/services/products.service';
import { environment } from '../../../../environments/environment'

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [AsyncPipe, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.css'
})
export class EditProductComponent {
  
  productData$!: Observable<Product | null>; 
  providerData$!: Observable<Provider | null>;
  selectedFile: File | null = null;

  private productsService = inject(ProductsService);

  constructor(private dataService: DataService, private http: HttpClient) {    
    this.productData$ = this.dataService.currentProduct;
    this.providerData$ = this.dataService.currentProvider;
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
    console.log('Submitting product:', product);
    // 1. Call the service method, passing the product ID and the entire product object.
    this.productsService.updateProduct(product.id!, product)
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
