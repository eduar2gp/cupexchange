import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Transaction } from '../../model/transaction.model';
import { Page } from '../../model/page.model';
import { Observable } from 'rxjs';
import { TransactionRequest } from '../../model/transaction-request.model'
import { build, ApiEndpoints } from '../../../app/core/api/endpoints'; 
import { PaymentGateway } from '../../model/payment-gateway.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  
  getTransactionsByUserIdPaginated(
    userId: string | number,
    page: number = 0,
    size: number = 20
  ): Observable<Page<Transaction>> {
    const url = build(ApiEndpoints.transaction.USER_TRANSACTIONS_ENDPOINT) + `/${userId}/paged`;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<Transaction>>(url, { params });
  }

  deposit(deposit: TransactionRequest): Observable<string> {   
    const fullUrl = build(ApiEndpoints.transaction.DEPOSIT_ENDPOINT);
    return this.http.post(fullUrl, deposit, {
      responseType: 'text' as 'json' // Use 'text' to match Observable<string>
    }) as Observable<string>;
  }

  withdrawal(deposit: TransactionRequest): Observable<string> {
    const fullUrl = build(ApiEndpoints.transaction.WITHDRAWAL_ENDPOINT);
    return this.http.post(fullUrl, deposit, {
      responseType: 'text' as 'json' // Use 'text' to match Observable<string>
    }) as Observable<string>;
  }

  getPaymentGateways(currency: string): Observable<PaymentGateway[]> {
    const fullUrl = build(ApiEndpoints.transaction.PAYMENT_GATEWAYS_ENDPOINT) + currency;
    return this.http.get<PaymentGateway[]>(fullUrl);
  }

}
