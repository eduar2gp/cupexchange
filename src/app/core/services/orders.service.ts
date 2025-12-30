import { Injectable, inject } from '@angular/core';
//import { Firestore, collection, collectionData, CollectionReference } from '@angular/fire/firestore';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { Order } from '../../model/order.model';
import { OrderPlaced } from '../../model/order_placed.model';
import { PublicOrderDTO } from '../../model/public_order_dto';
import { Page } from '../../model/page.model';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  //private readonly ordersCollection: CollectionReference<Order>;
  private readonly ORDERS_ENDPOINT = '/api/v1/trade/user/orders';
  private readonly CANCEL_ORDER_ENDPOINT = '/api/v1/trade/order/cancel/{orderId}';

  // Use inject() consistently for both — this is the modern standalone-friendly way
  //private firestore = inject(Firestore);
  private http = inject(HttpClient);

  constructor() {
    //this.ordersCollection = collection(this.firestore, 'providers') as CollectionReference<Order>;
  }

  //getOrdersFromFireStore(): Observable<Order[]> {
   // return collectionData(this.ordersCollection, { idField: 'id' }) as Observable<Order[]>;
  //}

  getOrdersFromExchangeBackend(): Observable<OrderPlaced[]> {
    const fullUrl = `${environment.baseApiUrl}${this.ORDERS_ENDPOINT}`;
    return this.http.get<OrderPlaced[]>(fullUrl);
  }

  
  cancelOrder(order: OrderPlaced | undefined, userName: string): Observable<string> | Observable<never> {

    // Check if the 'order' object is defined and has an 'id'
    if (!order || order.id === undefined) {
      console.error('Cancel Order failed: Order or Order ID is missing.');
      // You must handle the error path! Return an observable error or stop execution.
      return throwError(() => new Error('Order ID is required to cancel the order.'));
    }

    // Now, TypeScript knows 'order' and 'order.id' are defined in this block.
    // --- 1. Replace the Path Variable ({orderId}) ---
    const urlWithPath = this.CANCEL_ORDER_ENDPOINT.replace('{orderId}', order.id.toString());

    // ... rest of the method ...
    let fullUrl = `${environment.baseApiUrl}${urlWithPath}`;
    fullUrl = `${fullUrl}?username=${encodeURIComponent(userName)}`;

    return this.http.post(fullUrl, {}, { responseType: 'text' }) as Observable<string>;
  }

  /**
   * Fetches a page of recent orders for the given pair (public view).
   */
  findRecentOrdersPaged(
    pairCode: string,
    page: number = 0,
    size: number = 20
  ): Observable<Page<PublicOrderDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const fullUrl = `${environment.baseApiUrl}/api/v1/trade/public/recent-orders/${pairCode}/paged`;

    return this.http.get<Page<PublicOrderDTO>>(fullUrl, { params });
  }

  /**
   * Convenience: Get just the first N recent orders
   */
  findTopNByPairCode(pairCode: string, n: number = 50): Observable<PublicOrderDTO[]> {
    return this.findRecentOrdersPaged(pairCode, 0, n).pipe(
      map(page => page.content)
    );
  }
}
