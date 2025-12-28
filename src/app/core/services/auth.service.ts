import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment'

import { Role } from '../../model/roles.enum';
import { User } from '../../model/user.model';
import { DataService } from '../../core/services/data.service';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  jwtToken: string;
  userId: string;
  userName: string;
  providerId?: string | null;
  roles: Role[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dataService = inject(DataService);

  private readonly LOGIN_ENDPOINT = '/api/v1/auth/login';
  private readonly GOOGLE_LOGIN_ENDPOINT = '/api/v1/auth/google/login';

  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_ID_KEY = 'userId';

  // Reactive state using signals
  private readonly currentToken = signal<string | null>(null);
  private readonly currentUser = signal<User | null>(null);

  // Public readonly signals
  public readonly isAuthenticated = computed(() => !!this.currentToken());
  public readonly currentUser$ = this.currentUser.asReadonly();

  constructor() {
    this.loadStoredAuth();
  }

  /** Standard username/password login */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.baseApiUrl}${this.LOGIN_ENDPOINT}`, credentials)
      .pipe(tap(response => this.handleSuccessfulLogin(response)));
  }

  /** Google OAuth login */
  googleLogin(googleToken: { idToken: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.baseApiUrl}${this.GOOGLE_LOGIN_ENDPOINT}`, googleToken)
      .pipe(tap(response => this.handleSuccessfulLogin(response)));
  }

  /** Logout and clear all stored data */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_ID_KEY);
    }

    this.currentToken.set(null);
    this.currentUser.set(null);
    this.dataService.updateUser(null);
  }

  /** Get the current JWT token (from signal or localStorage fallback) */
  getToken(): string | null {
    const token = this.currentToken();
    if (token) return token;

    if (isPlatformBrowser(this.platformId)) {
      const storedToken = localStorage.getItem(this.TOKEN_KEY);
      if (storedToken) {
        this.currentToken.set(storedToken);
      }
      return storedToken;
    }

    return null;
  }

  /** Check if user has any of the required roles */
  hasRole(requiredRoles: Role[]): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;

    return requiredRoles.some(role => user.roles.includes(role));
  }

  /** Get current user synchronously (for guards, resolvers, etc.) */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  // ==================== Private Helpers ====================

  private handleSuccessfulLogin(response: AuthResponse): void {
    const user: User = {
      userId: response.userId,
      userName: response.userName,
      providerId: response.providerId ?? null,
      jwtToken: response.jwtToken,
      roles: response.roles
    };

    this.storeToken(response.jwtToken, response.userId);
    this.currentUser.set(user);
    this.dataService.updateUser(user);
  }

  private storeToken(token: string, userId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    this.currentToken.set(token);
  }

  private loadStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem(this.TOKEN_KEY);
    const userId = localStorage.getItem(this.USER_ID_KEY);

    if (token && userId) {
      this.currentToken.set(token);
      // Optionally: fetch full user data if needed
      // Or assume user is authenticated without full profile
    }
  }
}
