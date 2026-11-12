import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductReviewResponse } from '../../model/product.model';
import { Page } from '../../model/page.model';
import { ProductSearchRequestDTO } from '../../model/product-search-request-dto.model';
import { ApiEndpoints, build } from '../api/endpoints';


/**
 * Defines the structure for a product object.
 */
@Injectable({
  // Makes the service available everywhere in your standalone app
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  

  /**
   * Fetches the list of products from the backend API.
   * The Authorization header is now automatically added by the AuthInterceptor.
   * @returns An Observable array of Product objects.
   */
  getProducts(): Observable<Product[]> {    
    return this.http.get<Product[]>(build(ApiEndpoints.products.GET_PRODUCTS));
  }

  /**
   * Fetches paged products based on user location and category filters.
   */
  postSearchProducts(
    request: ProductSearchRequestDTO,
    page: number = 0,
    size: number = 20
  ): Observable<Page<Product>> {

    // Add pagination as query parameters
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.post<Page<Product>>(
      build(ApiEndpoints.products.SEARCH_PRODUCTS),
      request,
      { params }
    );
  }

  getProductsByProvider(providerId: number): Observable<Product[]> {
    const url = `${build(ApiEndpoints.products.GET_PRODUCTS_BY_PROVIDER)}/${providerId}`;
    return this.http.get<Product[]>(url);
  }

  /**
   * Sends a POST request to create a new product.
   * The Authorization header is automatically added by the AuthInterceptor.
   * @param product The product data to save.
   * @returns An Observable of the created Product object (with ID).
   */
  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(build(ApiEndpoints.products.CREATE_PRODUCT), product);
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
    const fullUrl = build(ApiEndpoints.products.UPDATE_PRODUCT, { id });
    // Use `put` for replacing the entire resource, or `patch` for partial updates.
    return this.http.put<Product>(fullUrl, product);
  }


  // Service method to send the multipart/form-data request
  saveProductWithImage(productId: number, formData: FormData): Observable<Product> {
    const fullUrl = build(ApiEndpoints.products.UPLOAD_PRODUCT_IMAGE, { productId });
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
    const fullUrl = build(ApiEndpoints.products.DELETE_PRODUCT, { id });
    // The <void> or <any> type depends on what your API returns (often an empty body for 204 No Content).
    return this.http.delete<void>(fullUrl);
  }

  getProductReviews(productId: number, page: number = 0, size: number = 10): Observable<ProductReviewResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ProductReviewResponse>(
      build(ApiEndpoints.products.GET_PRODUCT_REVIEWS, { productId }),
      { params }
    );
  }

}
