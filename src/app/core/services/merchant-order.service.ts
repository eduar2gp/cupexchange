import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateOrderRequest } from '../../model/create-merchant-order-request.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'
import { MerchantOrder } from '../../model/merchant-order-response.model'
import { build, ApiEndpoints } from '../../../app/core/api/endpoints';
import { CashOrder } from '../../model/cash-order-response.model';
import { Page } from '../../model/page.model';
import { HttpParams } from '@angular/common/http';
import { CashOrderRequestDTO } from '../../model/cash-order-request.model';

@Injectable({ providedIn: 'root' })
export class MerchantOrdersService {

  private MERCHANT_ADD_ORDERS_ENDPOINT = '/api/v1/merchant/add-order';
  private MERCHANT_GET_ORDERS = '/api/v1/merchant/orders/customer';
  private MERCHANT_GET_ORDERS_BY_PROVIDER = '/api/v1/merchant/orders/';

  constructor(private http: HttpClient) { }


  createCashOrder(order: CashOrderRequestDTO): Observable<any> {
    const fullUrl = build(ApiEndpoints.merchant.MERCHANT_ADD_CASH_ORDER)
    return this.http.post(fullUrl, order);
  }

  createOrder(order: CreateOrderRequest): Observable<any> {
    const fullUrl = `${environment.baseApiUrl}${this.MERCHANT_ADD_ORDERS_ENDPOINT}`;
    return this.http.post(fullUrl, order);
  }

  getAllMerchantOrdersByCustomer(page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc'
  ): Observable<Page<MerchantOrder>> {
    const url = `${environment.baseApiUrl}${this.MERCHANT_GET_ORDERS}`;
     const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<Page<MerchantOrder>>(url, { params });
  }

  getCashMerchantOrdersByProviderId(
    providerId: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc'
  ): Observable<Page<CashOrder>> {
    const url = build(ApiEndpoints.merchant.MERCHANT_GET_CASH_ORDERS_BY_PROVIDER, {
      providerId: providerId
    });
    // Set up the query parameters for Spring Pageable
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<Page<CashOrder>>(url, { params });
  }

  getCashMerchantOrdersByUserId(
    page: number = 0,
    size: number = 20,
    sort: string = 'createdAt,desc'
  ): Observable<Page<CashOrder>> {
    const url = build(ApiEndpoints.merchant.MERCHANT_GET_CASH_ORDERS_BY_USER);
    // Set up the query parameters for Spring Pageable
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<Page<CashOrder>>(url, { params });
  }

  getAllMerchantOrdersByProvider(
    providerId: string,
    page: number = 0,
    size: number = 20,
    sort: string = 'createdAt,desc'): Observable<Page<MerchantOrder>> {
      const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    const url = `${environment.baseApiUrl}${this.MERCHANT_GET_ORDERS_BY_PROVIDER}${providerId}`;
    return this.http.get<Page<MerchantOrder>>(url, {params});
  }

  updateOrderStatus(merchantOrderId: number, status: string): Observable<string> {
    const url = build(ApiEndpoints.merchant.MERCHANT_UPDATE_ORDER_STATUS);
    const payload = {
      merchantOrderId: merchantOrderId,
      status: status
    };
    // Tell HttpClient to treat the response as plain text
    return this.http.put(url, payload, { responseType: 'text' });
  }

  updateCashOrderStatus(cashOrderId: number, status: string): Observable<string> {
    const url = build(ApiEndpoints.merchant.MERCHANT_UPDATE_CASH_ORDER_STATUS);
    const payload = {
      orderId: cashOrderId,
      status: status
    };
    // Tell HttpClient to treat the response as plain text
    return this.http.put(url, payload, { responseType: 'text' });
  }
}