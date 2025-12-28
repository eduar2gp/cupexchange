import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // 💡 Removed HttpHeaders, as interceptor handles it
import { Observable } from 'rxjs';
import { Provider } from '../../model/provider.model'
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {

  private http = inject(HttpClient);
  // private authService = inject(AuthService); // 💡 Removed injection, token is retrieved by Interceptor

  private BASE_API_URL = environment.baseApiUrl;
  // 💡 Note: Your previous products endpoint was '/api/v1/products'. 
  // If BASE_API_URL already ends with '/api/v1', this should just be '/products'.
  // I will assume BASE_API_URL includes the version path and correct the endpoint:
  private PROVIDERS_ENDPOINT = '/api/v1/providers';

  /**
   * Fetches the list of products from the backend API.
   * The Authorization header is now automatically added by the AuthInterceptor.
   * @returns An Observable array of Product objects.
   */
  getProviders(): Observable<Provider[]> {
    const fullUrl = `${this.BASE_API_URL}${this.PROVIDERS_ENDPOINT}`;
    return this.http.get<Provider[]>(fullUrl);
  }

  updateProvider(providerId: number, provider: Provider): Observable<Provider> {
    const fullUrl = `${this.BASE_API_URL}${this.PROVIDERS_ENDPOINT}/${providerId}`;
    return this.http.put<Provider>(fullUrl, provider);
  }
  
  updateProviderImage(providerId: number, formData: FormData): Observable<Provider> {
    const fullUrl = `${this.BASE_API_URL}${this.PROVIDERS_ENDPOINT}/${providerId}/image`;    
    return this.http.post<Provider>(fullUrl, formData);
  }

  createProvider(provider: Provider): Observable<Provider> {
    const fullUrl = `${this.BASE_API_URL}${this.PROVIDERS_ENDPOINT}`;
    return this.http.post<Provider>(fullUrl, provider);
  }
  
}
