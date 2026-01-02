import { Component, inject, OnInit, signal, PLATFORM_ID, NgZone, AfterViewInit} from '@angular/core';
import { Router, RouterModule} from '@angular/router';


import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment'

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';              // ← Add this
import { MatButtonModule } from '@angular/material/button';
declare const google: any;
import { TranslateModule } from '@ngx-translate/core';

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
  
  constructor(private ngZone: NgZone) {
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
      this.router.navigate(['/dashboard']);
    }
    
  }

  onLogin(): void {
    this.loginError.set(null); // Clear previous errors
    this.loading.set(true);
    this.authService.login(this.credentials).subscribe({
      next: () => {
        // Successful login, redirect to ...
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // Handle login failure (e.g., show an error message)
        console.error('Login Failed', err);
        this.loginError.set('Invalid username or password. Please try again.');
        this.loading.set(false);
      }
    });
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.ngZone.run(() => this.handleCredentialResponse(response)),
      // Optional: auto_select: true for One Tap on page load
    });

    // Optional: Render a button (instead of using the one-tap prompt)
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large' } // Customization options
    );

    // Optional: Display the One Tap prompt
     //google.accounts.id.prompt(); 
  }

  goToRegister() {
    this.router.navigate(['/register']); // adjust route path as needed
  }

  handleCredentialResponse(response: any) {    
    const idToken = response.credential;
    this.googleJWT.idToken = idToken;
    this.authService.googleLogin({ idToken: idToken }).subscribe({
      next: () => {
        // Successful login, redirect to ...
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // Handle login failure (e.g., show an error message)
        console.error('Login Failed', err);
        this.loginError.set('Invalid username or password. Please try again.');
      }
    });    
  }
}
