import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Transaction } from '../../model/transaction.model';
import { Page } from '../../model/page.model';
import { Observable } from 'rxjs';
import { TransactionRequest } from '../../model/transaction-request.model'
import { build, ApiEndpoints } from '../api/endpoints';
import { PaymentGateway } from '../../model/payment-gateway.model';
import { Account } from '../../model/account.model';
import { PaymentRequest } from '../../model/payment-request.model';
import { PaymentResponse } from '../../model/payment-request.model';

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

  addPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    const fullUrl = build(ApiEndpoints.transaction.ADD_PAYMENT);
    return this.http.post(fullUrl, paymentRequest, {
      responseType: 'json' as 'json' // Use 'json' to match Observable<PaymentResponse>
    }) as Observable<PaymentResponse>;
  }
  
  updateReceipt(paymentId: number, formData: FormData): Observable<PaymentResponse> {
    const url = build(ApiEndpoints.transaction.UPDATE_RECEIPT).replace('{id}', paymentId.toString());
    return this.http.put<PaymentResponse>(url, formData);
  }

  getPaymentGateways(currency: string): Observable<PaymentGateway[]> {
    const fullUrl = build(ApiEndpoints.transaction.PAYMENT_GATEWAYS_ENDPOINT) + currency;
    return this.http.get<PaymentGateway[]>(fullUrl);
  }

  getAccountsByGatewayCode(gatewayCode: string): Observable<Account[]> {
    const url = build(ApiEndpoints.transaction.ACCOUNT_BY_GATEWAY_ENDPOINT) + gatewayCode;
    return this.http.get<Account[]>(url);
  }

  getAccountsByUserIdAndGatewayCode(gatewayCode: string): Observable<Account[]> {
    const url = build(ApiEndpoints.transaction.ACCOUNT_BY_USERID_AND_GATEWAY_ENDPOINT) + gatewayCode;
    return this.http.get<Account[]>(url);
  }

}