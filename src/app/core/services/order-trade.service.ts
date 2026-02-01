import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { OrderTrade } from '../../model/order_trade.model'
import { build, ApiEndpoints } from '../../../app/core/api/endpoints'; 

@Injectable({
  providedIn: 'root'
})
export class OrderTradeService {

  private http = inject(HttpClient);

  constructor() {    
  }

  saveOrder(data: OrderTrade): Observable<string> {
    // Use 'text' for responseType to handle non-JSON string responses
    const fullUrl = build(ApiEndpoints.order.NEW_ORDER_ENDPOINT);
    return this.http.post(
      fullUrl,
      data,
      { responseType: 'text' } // <--- CRITICAL FIX
    ) as Observable<string>;
  }

  getMarketOrderTotalPriceEstimated(volume: number, side: string, pairCode: string): Observable<string> {
    const params = {
      volume: volume.toString(),
      side: side.toString(),
      pairCode: pairCode.toString()
    };

    const fullUrl = build(ApiEndpoints.order.ESTIMATE_MARKET_ORDER_TOTAL_PRICE);

    return this.http.get(fullUrl, {
      params: params,
      responseType: 'text' // Both go inside the same config object
    });
  }
}
