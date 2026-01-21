import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // 💡 Removed HttpHeaders, as interceptor handles it
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // 💡 Keeping the import, but removing the injection/use
import { Product } from '../../model/product.model'
import { environment } from '../../../environments/environment'
import { Page } from '../../model/page.model';
import { ProductSearchRequestDTO } from '../../model/product-search-request-dto.model';

/**
 * Defines the structure for a product object.
 */
@Injectable({
  // Makes the service available everywhere in your standalone app
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  // private authService = inject(AuthService); // 💡 Removed injection, token is retrieved by Interceptor

  private BASE_API_URL = environment.baseApiUrl;
  // 💡 Note: Your previous products endpoint was '/api/v1/products'. 
  // If BASE_API_URL already ends with '/api/v1', this should just be '/products'.
  // I will assume BASE_API_URL includes the version path and correct the endpoint:
  private PRODUCTS_ENDPOINT = '/api/v1/products';
  private SEARCH_PRODUCTS_ENDPOINT = '/api/v1/products/search';
  private PRODUCTS_BYPROVIDER_ENDPOINT = '/api/v1/products/by-provider';
  

  /**
   * Fetches the list of products from the backend API.
   * The Authorization header is now automatically added by the AuthInterceptor.
   * @returns An Observable array of Product objects.
   */
  getProducts(): Observable<Product[]> {    
    const fullUrl = `${this.BASE_API_URL}${this.PRODUCTS_ENDPOINT}`;   
    return this.http.get<Product[]>(fullUrl);
  }

  /**
   * Fetches paged products based on user location and category filters.
   */
  postSearchProducts(
    request: ProductSearchRequestDTO,
    page: number = 0,
    size: number = 20
  ): Observable<Page<Product>> {

    const fullUrl = `${this.BASE_API_URL}${this.SEARCH_PRODUCTS_ENDPOINT}`;

    // Add pagination as query parameters
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.post<Page<Product>>(fullUrl, request, { params });
  }

  getProductsByProvider(providerId: number): Observable<Product[]> {
    const fullUrl = `${this.BASE_API_URL}${this.PRODUCTS_BYPROVIDER_ENDPOINT}/${providerId}`;
    return this.http.get<Product[]>(fullUrl);
  }

  /**
   * Sends a POST request to create a new product.
   * The Authorization header is automatically added by the AuthInterceptor.
   * @param product The product data to save.
   * @returns An Observable of the created Product object (with ID).
   */
  createProduct(product: Product): Observable<Product> {
    const fullUrl = `${this.BASE_API_URL}${this.PRODUCTS_ENDPOINT}`;
    return this.http.post<Product>(fullUrl, product);
  }


  // --- New Methods for Update and Delete ---

  /**
   * Sends a PUT request to update an existing product.
   * Assumes the API endpoint is `/api/v1/products/{id}`.
   * @param id The ID of the product to update.
   * @param product The updated product data.
   * @returns An Observable of the updated Product object.
   */
  updateProduct(id: number, product: Product): Observable<Product> {
    const fullUrl = `${this.BASE_API_URL}${this.PRODUCTS_ENDPOINT}/${id}`;
    // Use `put` for replacing the entire resource, or `patch` for partial updates.
    return this.http.put<Product>(fullUrl, product);
  }


  // Service method to send the multipart/form-data request
  saveProductWithImage(productId: number, formData: FormData): Observable<Product> {
    const fullUrl = `${this.BASE_API_URL}${this.PRODUCTS_ENDPOINT}/${productId}/image`;
    // The key is that you pass the FormData object directly.
    // HttpClient automatically sets the Content-Type to multipart/form-data
    // and correctly includes the boundary identifier.

    // Assuming your backend POST endpoint is just '/api/v1/products' 
    // and handles creation/update based on the form data content.
    // If you are updating an existing product, you might use PUT/PATCH with an ID:
    // return this.http.put<Product>(`${this.apiUrl}/${productId}`, formData);

    // Based on your backend logic (which expects form data for creation), let's use POST:
    return this.http.post<Product>(fullUrl, formData);
  }

  /**
   * Sends a DELETE request to remove a product.
   * Assumes the API endpoint is `/api/v1/products/{id}`.
   * @param id The ID of the product to delete.
   * @returns An Observable that completes upon successful deletion (often returns an empty object {} or void).
   */
  deleteProduct(id: number): Observable<void> {
    const fullUrl = `${this.BASE_API_URL}${this.PRODUCTS_ENDPOINT}/${id}`;
    // The <void> or <any> type depends on what your API returns (often an empty body for 204 No Content).
    return this.http.delete<void>(fullUrl);
  }

}
