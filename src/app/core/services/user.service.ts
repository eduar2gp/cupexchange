import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfileData } from '../../model/user-profile-data.model';
import { User } from '../../model/user.model'

export interface UserRegister {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private REGISTER_ENDPOINT = '/api/v1/auth/register';
  private VERIFY_ENDPOINT = '/api/v1/auth/verify';
  private UPDATE_PROFILE_ENDPOINT = '/api/v1/auth/update/profile';
  private UPDATE_FCMTOKEN_ENDPOINT = '/api/v1/auth/update/fcm-token';

  private fullUrl = `${environment.baseApiUrl}${this.REGISTER_ENDPOINT}`;

  register(user: UserRegister): Observable<any> {
    return this.http.post(this.fullUrl, user);
  }

  verify(code: string): Observable<string> {
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

  updateUserProfile(user: UserProfileData): Observable<User> {
    const updateUrl = `${environment.baseApiUrl}${this.UPDATE_PROFILE_ENDPOINT}`
    return this.http.post<User>(updateUrl, user);
  }

  updateUserFCMToken(token: string | null): Observable<void> {
    const updateFcmUrl = `${environment.baseApiUrl}${this.UPDATE_FCMTOKEN_ENDPOINT}`
    const payload = { deviceToken: token }    
    return this.http.post<void>(updateFcmUrl, payload);
  }
}
