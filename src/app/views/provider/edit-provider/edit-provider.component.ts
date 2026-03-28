import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Provider } from '../../../model/provider.model';
import { Product } from '../../../model/product.model'
import { AsyncPipe, CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProvidersService } from '../../../core/services/providers.service';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from '../../../../environments/environment'
import { ProductsService } from '../../../core/services/products.service';
import { Subject, switchMap, filter, Subscription, Observable, combineLatest, startWith, forkJoin } from 'rxjs';
import { Province } from '../../../model/province.model'
import { Municipality } from '../../../model/muncipality.model'
import { MatSelectModule } from '@angular/material/select';
import { ProviderCoveragePayload } from '../../../model/provider-coverage-response.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../model/user.model';
import { Page } from '../../../model/page.model'
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { toSignal } from '@angular/core/rxjs-interop';


@Component({
  standalone: true,
  selector: 'app-edit-provider.component',
  imports: [AsyncPipe, FormsModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatCardModule, TranslateModule,
    CommonModule, MatSelectModule,
    MatProgressSpinnerModule, MatChipsModule,
    MatProgressBarModule, MatTableModule, MatPaginatorModule,
    MatSnackBarModule],
  templateUrl: './edit-provider.component.html',
  styleUrl: './edit-provider.component.scss',
})
export class EditProviderComponent implements OnInit {

  private reloadTrigger = new Subject<void>();
  private productsSubscription: Subscription | undefined;

  // providerData$!: Observable<Provider | null>;
  selectedFile: File | null = null;
  private providersService = inject(ProvidersService);
  private productsService = inject(ProductsService);
  private userService = inject(UserService)
  private dataService = inject(DataService)
  private router = inject(Router);
  productsList = signal<Product[]>([]);

  public provinces: Province[] = [];
  public allMunicipalities: Municipality[] = [];

  selectedProvinceId = signal<number | null>(null);
  selectedMunicipalityId = signal<number | null>(null);
  filteredMunicipalities = signal<Municipality[]>([]);

  // Add this to your class properties
  providerCoverage = signal<ProviderCoveragePayload | null>(null);

  // Properties to add to your class
  public searchResults = signal<User[]>([]);
  isSearching = signal<boolean>(false);
  searchTotalElements = signal<number>(0);

  // For tracking pagination state
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);

  lastSearchTerm = signal<string>('');

  provider = toSignal(this.dataService.currentProvider);

  constructor(private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.loadLocationData();
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
      switchMap(([provider]) => {
        // Use forkJoin to fetch Products AND Coverage at the same time
        return forkJoin({
          products: this.productsService.getProductsByProvider(provider.id!),
          coverage: this.providersService.getProvidersCoverage(provider.id!)
        });
      })
    ).subscribe({
      next: (result) => {
        this.productsList.set(result.products);
        // You'll need a signal or property to store this (see step 2)
        this.providerCoverage.set(result.coverage);
      },
      error: (err) => {
        console.error('Error fetching provider details:', err);
        this.productsList.set([]);
      }
    });

  }

  onSearchUsers(term: string) {
    if (!term) return;

    this.lastSearchTerm.set(term);
    this.isSearching.set(true);

    // We pass the signals for page and size
    this.userService.getUsersWithoutProvider(
      this.currentPage(),
      this.pageSize(),
      term, // username
      term, // phone
      term  // email
    ).subscribe({
      next: (response) => {
        this.searchResults.set(response.content);
        this.searchTotalElements.set(response.totalElements);
        this.isSearching.set(false);
      },
      error: () => this.isSearching.set(false)
    });
  }

  handlePageEvent(e: PageEvent) {
    this.currentPage.set(e.pageIndex);
    this.pageSize.set(e.pageSize);

    // Re-run the search with the new page/size using the stored term
    this.onSearchUsers(this.lastSearchTerm());
  }

  private loadLocationData(): void {
    const provJson = localStorage.getItem('PROVINCES');
    const muniJson = localStorage.getItem('MUNICIPALITIES');

    this.provinces = provJson ? JSON.parse(provJson) : [];
    this.allMunicipalities = muniJson ? JSON.parse(muniJson) : [];
  }

  // Filter municipalities when province changes
  onProvinceChange(provinceId: number): void {
    this.selectedProvinceId.set(provinceId);
    const filtered = this.allMunicipalities.filter(m => m.provinceId === provinceId);
    this.filteredMunicipalities.set(filtered);
    this.selectedMunicipalityId.set(null); // Reset selection
  }

  onLinkMunicipality(): void {
    const muniId = this.selectedMunicipalityId();
    if (!muniId) return;

    // 1. Grab the user profile from localStorage
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');

    if (savedProfileJson) {
      try {
        // 2. Parse the JSON string into an object
        const currentUser = JSON.parse(savedProfileJson);

        // 3. Extract the providerId from the profile
        const providerId = currentUser.providerId;

        if (!providerId) {
          console.error('User profile found, but no providerId is associated with this account.');
          return;
        }

        // 4. Perform the POST request using the ID from the profile
        this.providersService.linkProviderMunicipality(providerId, muniId).subscribe({
          next: (response) => {
            console.log(`Provider ${providerId} linked to Municipality ${muniId}`);
            // Reset the selection after success
            this.selectedMunicipalityId.set(null);
            this.showToast(response, 'Success')
          },
          error: (err) => {
            this.showToast(err.error, 'Error')
            console.error('Error linking municipality:', err)
          }
        });

      } catch (e) {
        console.error('Error parsing USER_PROFILE_DATA from localStorage', e);
      }
    } else {
      console.warn('No USER_PROFILE_DATA found in storage.');
    }
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

  private showToast(message: string, type: 'Success' | 'Error'): void {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: type === 'Success' ? ['snackbar-success'] : ['snackbar-error'] });
  }

  onLinkUser(user: User) {
    const currentProvider = this.provider();
    const roleName = 'ROLE_STORE_MANAGER';
    // 2. Debugging: Check if these exist
    console.log('User object received from template:', user);
    console.log('Linking User:', user.id, 'to Provider:', currentProvider?.id);
    // 3. Validation to prevent the .toString() error
    if (!user?.id || !currentProvider?.id) {
        this.snackBar.open('Missing User ID or Provider ID', 'Close');
        return;
    }
    // Ensure you use user.id (matching your Backend Entity)
    this.userService.linkUserToProvider(user.id, currentProvider.id, roleName).subscribe({
      next: () => {
        this.snackBar.open(`User linked successfully`, 'Close', { duration: 3000 });
        this.searchResults.update(users => users.filter(u => u.id !== user.id));
      },
      error: (err) => {
        const message = err.status === 403 ? 'Admin role required' : 'Action failed';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }
}