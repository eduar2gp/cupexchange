import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { environment } from '../../../environments/environment'
import { OrderTrade } from '../../model/order_trade.model'


@Injectable({
  providedIn: 'root'
})
export class OrderTradeService {

  private http = inject(HttpClient);

  private NEW_ORDER_ENDPOINT = '/api/v1/trade/order';

  fullUrl = `${environment.baseApiUrl}${this.NEW_ORDER_ENDPOINT}`;
  constructor() {    
  }

  saveOrder(data: OrderTrade): Observable<string> {
    // Use 'text' for responseType to handle non-JSON string responses
    return this.http.post(
      this.fullUrl,
      data,
      { responseType: 'text' } // <--- CRITICAL FIX
    ) as Observable<string>;
  }

}
