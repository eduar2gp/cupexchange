import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service'; // Assuming service filename is auth.service.ts

/**
 * Interceptor function that automatically attaches the JWT Bearer token 
 * to the Authorization header of every outgoing HTTP request.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // If no token is present, simply pass the original request
  if (!token) {
    return next(req);
  }

  // Clone the request and set the Authorization header
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedRequest);
};
