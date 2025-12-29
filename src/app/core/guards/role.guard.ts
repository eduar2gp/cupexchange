import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../../model/roles.enum';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const platformId = inject(PLATFORM_ID);

  // ⛔ During build / SSR, DO NOT run auth logic
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Get the roles required from the route data
  // The 'roles' key here must match what you put in app-routing.module.ts
  const requiredRoles = route.data['roles'] as Role[];

  // 2. Check basic authentication first
  if (!authService.isAuthenticated()) {
    // If not logged in at all, redirect to login page with return url
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // 3. If the route doesn't require specific roles, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // 4. Check if user has required role
  if (authService.hasRole(requiredRoles)) {
    return true;
  }

  // 5. If user is authenticated but lacks the role, redirect to forbidden page
  // You should create a simple 'ForbiddenComponent' for this route.
  return router.createUrlTree(['/login']);
};
