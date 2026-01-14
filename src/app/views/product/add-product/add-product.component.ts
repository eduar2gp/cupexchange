import { Component, OnInit, signal, inject, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Needed for forms and ngModel
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../model/product.model'
import { DataService } from '../../../core/services/data.service';
import { Observable, Subscription } from 'rxjs';
import { Provider } from '../../../model/provider.model';
import { environment } from '../../../../environments/environment'

// 💡 Removed API_URL constant since the service now handles it

@Component({
  selector: 'app-add-product-form-component',
  standalone: true,
  // 💡 Removed HttpClientModule since the service is root-provided and handles HTTP
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {
  // 💡 Injected the dedicated service instead of HttpClient
  private productsService = inject(ProductsService);

  private providerSubscription: Subscription | undefined;

  providerData$!: Observable<Provider | null>;

  selectedFile: File | null = null;

  // Initial form model state
  newProduct: Product = { name: '', description: '', price: 0.01, stockQuantity: 1, provider: 0 };

  saving = signal(false);
  statusMessage = signal<string | null>(null);
  isSuccess = false;

  //@Output() productAdded = new EventEmitter<void>();

  constructor(private dataService: DataService) {    
    this.providerData$ = this.dataService.currentProvider;
  }

  /**
   * Resets the form after successful submission.
   */
  private resetForm(): void {
    this.newProduct = { name: '', description: '', price: 0.01, stockQuantity: 1, provider: 0 };
    // Clear status message after a short delay
    setTimeout(() => this.statusMessage.set(null), 3000);
  }

  /**
   * Sends a POST request to the Spring Boot API to save a new product using the ProductsService.
   */
  saveProduct(isValid: boolean): void {
    if (!isValid) {
      this.statusMessage.set('Please fill out all required fields.');
      this.isSuccess = false;
      return;
    }

    this.saving.set(true);
    this.statusMessage.set(null);
    //this.newProduct.provider = this.providerData$.id;
    this.providerSubscription = this.providerData$.subscribe(
      (provider: Provider | null) => {
        // 2. The code inside this block runs when the data arrives
        if (provider && provider?.id !== undefined) {
          // 3. Access the 'id' property on the actual 'provider' object
          this.newProduct.provider = provider.id;
          // Now you can proceed with saving the product
          // this.productService.addProduct(this.newProduct).subscribe(...);
          this.productsService.createProduct(this.newProduct).subscribe({
            next: (response) => {
              this.statusMessage.set(`Success! Product '${response.name}' created (ID: ${response.id}).`);

              if (this.selectedFile) {
                const formData = new FormData();
                formData.append('file', this.selectedFile, this.selectedFile.name);
                this.productsService.saveProductWithImage(response.id!, formData).subscribe({
                  next: (updatedProduct: any) => {
                    console.log('Provider image saved successfully!', updatedProduct);
                    // Handle success (e.g., navigate, show notification)
                    this.isSuccess = true;
                    this.saving.set(false);
                    this.resetForm();
                  },
                  error: (err: any) => {
                    console.error('Error saving product:', err);
                    // Handle error
                  }
                });
              }            
              // Notify the parent component (ProductListComponent) to refresh its list
              //this.productAdded.emit();
            },
            error: (err) => {
              console.error('Error saving product:', err);
              this.statusMessage.set(`Error saving product. Check console. Status: ${err.status}`);
              this.isSuccess = false;
              this.saving.set(false);
            }
          });
        } else {
          // Handle the case where provider is null (or when there's an error)
          console.warn('Provider data is null or loading.');
        }
      },
      (error) => {
        console.error('Error fetching provider data:', error);
      }
    );  
  }
  
  ngOnDestroy(): void {
    this.providerSubscription?.unsubscribe();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('file selected')
    }
  }

}
