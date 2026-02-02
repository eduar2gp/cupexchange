import { Component, inject, OnInit, signal, PLATFORM_ID, NgZone, AfterViewInit} from '@angular/core';
import { Router, RouterModule} from '@angular/router';

import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment'

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';              // ← Add this
import { MatButtonModule } from '@angular/material/button';
declare const google: any;
import { TranslateModule } from '@ngx-translate/core';
import { WalletService } from '../../core/services/wallet.service'
import { Wallet } from '../../model/wallet.model'
import { DataService } from '../../../app/core/services/data.service'
import { User } from '../../../app/model/user.model'


@Component({
  selector: 'app-login',
  standalone: true,  
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    RouterModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
  // Inject the service and router
  private authService = inject(AuthService);
  private router = inject(Router);

  private platformId = inject(PLATFORM_ID);  

  // Model to hold form data
  public credentials = { username: '', password: '' };
  public googleJWT = { idToken: ''}
  public loginError = signal<string | null>(null);
  loading = signal(false);

  hide: boolean = true;
  
  constructor(
    private ngZone: NgZone,
    private walletService: WalletService,
    private dataService: DataService
  ) {
  }

  ngAfterViewInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    if (typeof google === 'undefined') {
      this.loadGoogleScript().then(() => {
        this.initializeGoogleSignIn();
      });
    } else {
      this.initializeGoogleSignIn();
    }
  }
}

private loadGoogleScript(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

  /*ngAfterViewInit(): void {    
    if (isPlatformBrowser(this.platformId)) {       
      if (typeof google !== 'undefined') {
        this.initializeGoogleSignIn();
      }
    }
  }*/

  ngOnInit(): void {
    // Optional: Check if already logged in and redirect
    // Check if already logged in and redirect, but only in the browser
    if (isPlatformBrowser(this.platformId) && this.authService.getToken()) {
      if (localStorage.getItem('IS_ECOMMERCE_MODE') === 'true')
        this.router.navigate(['/ecommerce-dashboard']);
      else
        this.router.navigate(['/exchange-dashboard']);
    }
  }

  onLogin(): void {
    this.loginError.set(null);
    this.loading.set(true);
    this.authService.login(this.credentials).subscribe({
      next: (user: User) => {
        this.processLoginSuccess(user); // Use shared logic
      },
      error: (err) => {
        console.error('Login Failed', err);
        this.loginError.set('Invalid username or password. Please try again.');
        this.loading.set(false);
      }
    });
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => {
        // Run inside NgZone so Angular detects data changes
        this.ngZone.run(() => {
          console.log('Google Credential Response:', response);
          this.handleCredentialResponse(response);
        });
      }
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large' }
    );
  }

  goToRegister() {
    this.router.navigate(['/register']); // adjust route path as needed
  }

  handleCredentialResponse(response: any) {
    const idToken = response.credential;
    this.loading.set(true); // Set loading for Google login too

    this.authService.googleLogin({ idToken }).subscribe({
      next: (user: User) => {
        console.log('Google Auth Successful');
        this.processLoginSuccess(user); // Use shared logic
      },
      error: (err) => {
        console.error('Google Login Backend Error:', err);
        this.loading.set(false);
        if (err.status === 401) {
          this.loginError.set('Google authentication failed. Please try again.');
        } else {
          this.loginError.set('A server error occurred. Please try again later.');
        }
      }
    });
  }

  /**
   * Centralized logic to handle successful authentication
   * for both Google and regular login.
   */
  private processLoginSuccess(user: User): void {
    // 1. Save user profile to local storage
    localStorage.setItem('USER_PROFILE_DATA', JSON.stringify(user));

    // 2. Update DataService signal (assuming it handles the current user state)
    this.dataService.updateUser(user);

    // 3. Fetch wallets and navigate
    this.fetchWallets();
  }

  fetchWallets(): void {
    this.walletService.getWallets().subscribe({
      next: (wallets: Wallet[]) => {
        localStorage.setItem('WALLETS', JSON.stringify(wallets));
        this.dataService.walletUpdateCompleted();

        // 4. Navigate based on mode
        const isEcommerce = localStorage.getItem('IS_ECOMMERCE_MODE') === 'true';
        const targetRoute = isEcommerce ? '/ecommerce-dashboard' : '/exchange-dashboard';
        this.router.navigate([targetRoute]);
      },
      error: (err) => {
        console.error('Error loading wallets!.', err);
        this.loading.set(false);
        // Even if wallets fail, you might want to navigate anyway, 
        // or stay on login with an error. 
      }
    });
  }
}
