import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Transaction } from '../../model/transaction.model';
import { Page } from '../../model/page.model';
import { Observable } from 'rxjs';
import { TransactionRequest } from '../../model/transaction-request.model'


@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.baseApiUrl;
  private readonly USER_TRANSACTIONS_ENDPOINT = '/api/v1/transactions/user';
  private readonly DEPOSIT_ENDPOINT = '/api/v1/trade/transaction/deposit';
  private readonly WITHDRAWAL_ENDPOINT = '/api/v1/trade/transaction/withdraw';
  
  getTransactionsByUserIdPaginated(
    userId: string | number,
    page: number = 0,
    size: number = 20
  ): Observable<Page<Transaction>> {
    const url = `${this.BASE_URL}${this.USER_TRANSACTIONS_ENDPOINT}/${userId}/paged`;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<Transaction>>(url, { params });
  }

  deposit(deposit: TransactionRequest): Observable<string> {
    const fullUrl = `${this.BASE_URL}${this.DEPOSIT_ENDPOINT}`;
    return this.http.post(fullUrl, deposit, {
      responseType: 'text' as 'json' // Use 'text' to match Observable<string>
    }) as Observable<string>;
  }

  withdrawal(deposit: TransactionRequest): Observable<string> {
    const fullUrl = `${this.BASE_URL}${this.WITHDRAWAL_ENDPOINT}`;
    return this.http.post(fullUrl, deposit, {
      responseType: 'text' as 'json' // Use 'text' to match Observable<string>
    }) as Observable<string>;
  }

}
