import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProvidersService } from '../../../core/services/providers.service';
import { User } from '../../../model/user.model'; // Assuming User model path
import { DataService } from '../../../core/services/data.service'; // Assuming DataService path
import { Provider } from '../../../model/provider.model'; // Assuming Provider model path
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  standalone: true,
  selector: 'app-provider-dashboard', // Changed selector to follow common conventions
  imports: [
    AsyncPipe,
    TranslateModule,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './provider-dashboard.component.html',
  styleUrl: './provider-dashboard.component.scss',
})
export class ProviderDashboardComponent implements OnInit {

  // Using inject for a more modern approach, keeping the original for the services
  private router = inject(Router);

  // Observable for provider data, initialized from the DataService
  providerData$: Observable<Provider | null>;
  
  constructor(
    private providersService: ProvidersService,
    private dataService: DataService
  ) {
    // 1. Initialize providerData$ to always point to the latest data stream
    this.providerData$ = this.dataService.currentProvider;
  }

  ngOnInit() {
    this.fetchAndSetProviderData();
  }

  private fetchAndSetProviderData(): void {
    const userJson = localStorage.getItem('USER_PROFILE_DATA');

    if (userJson) {
      try {
        const user = JSON.parse(userJson) as User;

        if (user.providerId) {
          // 2. Fetch data and update the DataService
          this.providersService.getProviderById(user.providerId).pipe(
            // Tap into the stream to update the shared DataService
            tap((provider: Provider) => {
              this.dataService.updateProvider(provider);
            }),
            // Handle error without breaking the app
            catchError(error => {
              console.error('Error fetching provider data:', error);
              // Optionally, navigate away or show a user-friendly error message
              // this.router.navigate(['/error']);
              // Return an Observable of null to handle the error gracefully in the template
              return of(null);
            })
          ).subscribe(); // Subscribe to trigger the data fetch

        } else {
          console.warn('User found, but providerId is missing.');
        }

      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    } else {
      console.warn('USER_PROFILE_DATA not found in localStorage. Cannot fetch provider.');
      // Optional: Redirect to login or profile setup
      // this.router.navigate(['/login']); 
    }
  }

  navigateToEditProvider() {
    this.router.navigate(['edit-provider'])
  }
  navigateToOrders() {
    this.router.navigate(['provider-orders'])
  }
}
