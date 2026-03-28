import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfileData } from '../../model/user-profile-data.model';
import { User } from '../../model/user.model'
import { build, ApiEndpoints } from '../../../app/core/api/endpoints';
import { Page } from '../../model/page.model';

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

  linkUserToProvider(userId: number, providerId: number, roleName: string): Observable<User> {
    const fullUrl = build(ApiEndpoints.auth.LINK_USER_PROVIDER, { userId, providerId });
    // 1. Reassign the params because .set() returns a new object
    const params = new HttpParams().set('roleName', roleName);
    // 2. Add an empty body {} as the second argument
    return this.http.patch<User>(fullUrl, {}, { params });
  }

  getUsersWithoutProvider(page: number = 0, size: number = 10, searchTerm: string): Observable<Page<User>> {

    const fullUrl = build(ApiEndpoints.auth.GET_USERS_WITHOUT_PROVIDER)

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<Page<User>>(fullUrl, { params });

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

  getUserProfile(userId?: string | number): Observable<UserProfileData> {
    // Build path using endpoints.auth.getUserProfile which includes the '?userId=' suffix.
    const userIdSegment = (userId !== undefined && userId !== null) ? encodeURIComponent(String(userId)) : '';
    const url = build(ApiEndpoints.auth.getUserProfile + userIdSegment);
    return this.http.get<UserProfileData>(url);
  }
}
