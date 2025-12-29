import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export function authBlockInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);

  const protectedUrls = [
    'add-order',
    'orders'
  ]; 

  const isProtected = protectedUrls.some(url => req.url.includes(url));

  // On server/prerender: always allow (or you'll get empty pages, but no crash)
  if (isProtected && !isServer && !authService.isAuthenticated()) {
    console.log(`Blocking unauthorized request (browser only): ${req.url}`);
    return EMPTY;
  }

  return next(req);
}
