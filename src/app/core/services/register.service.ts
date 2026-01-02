import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserRegister {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private http = inject(HttpClient);
  private REGISTER_ENDPOINT = '/api/v1/auth/register';
  private VERIFY_ENDPOINT =   '/api/v1/auth/verify';
  private fullUrl = `${environment.baseApiUrl}${this.REGISTER_ENDPOINT}`;

  register(user: UserRegister): Observable<any> {
    return this.http.post(this.fullUrl, user);
  }
  verify(code: string): Observable<string> { // Changed Observable<any> to Observable<string> for clarity
    if (!code) {
      // Using a standard Observable error for consistency in async flow
      return new Observable(observer => {
        observer.error(new Error('Verification code is required'));
      });
    }

    const verifyUrl = `${environment.baseApiUrl}${this.VERIFY_ENDPOINT}?code=${encodeURIComponent(code)}`;

    // FIX: Set responseType to 'text' to prevent the Angular HttpClient
    // from attempting to parse a plain string response as JSON, 
    // which causes the 'Unexpected token E' error.
    return this.http.get(verifyUrl, {
      responseType: 'text' // This tells Angular to expect a plain string body
    });
  }
}
