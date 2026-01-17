import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateOrderRequest } from '../../model/create-merchant-order-request.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class MerchantOrdersService {

  private MERCHANT_ORDERS_ENDPOINT = '/api/v1/merchant/add-order';

  constructor(private http: HttpClient) { }

  createOrder(order: CreateOrderRequest): Observable<any> {
    const fullUrl = `${environment.baseApiUrl}${this.MERCHANT_ORDERS_ENDPOINT}`;
    return this.http.post(fullUrl, order);
  }

}
