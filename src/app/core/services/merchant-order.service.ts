import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateOrderRequest } from '../../model/create-merchant-order-request.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'
import { MerchantOrder } from '../../model/merchant-order-reponse.model'
import { build, ApiEndpoints } from '../../../app/core/api/endpoints'; 

@Injectable({ providedIn: 'root' })
export class MerchantOrdersService {

  private MERCHANT_ADD_ORDERS_ENDPOINT = '/api/v1/merchant/add-order';
  private MERCHANT_GET_ORDERS = '/api/v1/merchant/orders/customer';
  private MERCHANT_GET_ORDERS_BY_PROVIDER = '/api/v1/merchant/orders/';

  constructor(private http: HttpClient) { }

  createOrder(order: CreateOrderRequest): Observable<any> {
    const fullUrl = `${environment.baseApiUrl}${this.MERCHANT_ADD_ORDERS_ENDPOINT}`;
    return this.http.post(fullUrl, order);
  }

  getAllMerchantOrdersByCustomer(): Observable<MerchantOrder[]> {
    const url = `${environment.baseApiUrl}${this.MERCHANT_GET_ORDERS}`;
    return this.http.get<MerchantOrder[]>(url);
  }

  getAllMerchantOrdersByProvider(providerId: string): Observable<MerchantOrder[]> {
    const url = `${environment.baseApiUrl}${this.MERCHANT_GET_ORDERS_BY_PROVIDER}${providerId}`;
    return this.http.get<MerchantOrder[]>(url);
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
}
