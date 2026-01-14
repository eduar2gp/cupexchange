import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Provider } from '../../../model/provider.model';
import { Product } from '../../../model/product.model'
import { AsyncPipe } from '@angular/common';

import { ProvidersService } from '../../../core/services/providers.service';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from '../../../../environments/environment'
import { ProductsService } from '../../../core/services/products.service';
import { Subject, switchMap, filter, Subscription, Observable, combineLatest, startWith } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-edit-provider.component',
  imports: [AsyncPipe, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './edit-provider.component.html',
  styleUrl: './edit-provider.component.css',
})
export class EditProviderComponent implements OnInit {

  private reloadTrigger = new Subject<void>();  
  private productsSubscription: Subscription | undefined;

  providerData$!: Observable<Provider | null>; 
  selectedFile: File | null = null;
  private providersService = inject(ProvidersService);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  productsList = signal<Product[]>([]);

  constructor(private dataService: DataService) {   
    this.providerData$ = this.dataService.currentProvider;
  }
 

  ngOnInit(): void {
    // 1. Add startWith() to the reloadTrigger stream
    const providerAndReload$ = combineLatest([
      this.dataService.currentProvider.pipe(
        filter((provider): provider is Provider => provider !== null)
      ),
      // Use startWith() to emit an initial value on subscription, 
      // replacing the need for this.reloadTrigger.next() at the end.
      this.reloadTrigger.pipe(startWith(undefined))
    ]);

    this.productsSubscription = providerAndReload$.pipe(
      switchMap(([provider, _]) => {
        return this.productsService.getProductsByProvider(provider.id!);
      })
    ).subscribe({
      next: (data: Product[]) => {
        this.productsList.set(data);
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.productsList.set([]);
      }
    });

    // 🛑 REMOVE THIS LINE: The initial emission is now handled by startWith()
    // this.reloadTrigger.next(); 
  }

  editProduct(product: Product) {
    this.dataService.updateProduct(product)
    this.router.navigate(['/edit-product']);
  }

  // 4. Improved deleteProduct method
  deleteProduct(productId: number): void {
    this.productsService.deleteProduct(productId).subscribe({
      next: () => {
        // Success: Notify the user and trigger the reload stream
        console.log(`Product ${productId} deleted successfully.`);
        // 5. CRITICAL STEP: Emit a value to the Subject to trigger the ngOnInit stream
        this.reloadTrigger.next();
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        // Handle error feedback to the user
      }
    });
  }

  ngOnDestroy(): void {
    this.productsSubscription?.unsubscribe();
    this.reloadTrigger.complete(); // Clean up the subject
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('file selected')
    }
  }

  saveChanges(provider: Provider): void {  
    console.log('Submitting provider:', provider);
    // 1. Call the service method, passing the product ID and the entire product object.
    this.providersService.updateProvider(provider.id!, provider)
      // 2. Subscribe to the Observable to trigger the HTTP request and handle the result.
      .subscribe({
        next: (updatedProduct: Provider) => {
          // This runs if the PUT request is successful (HTTP 200/204)
          console.log('Product updated successfully:', updatedProduct);
          //alert(`Product ${updatedProduct.name} updated!`);
          // Optional: Perform additional actions like refreshing the list or navigating.
          if (this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile, this.selectedFile.name);
            this.providersService.updateProviderImage(provider.id!, formData).subscribe({
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

  addProduct() {
    this.router.navigate(['/add-product']);
  }  

}
