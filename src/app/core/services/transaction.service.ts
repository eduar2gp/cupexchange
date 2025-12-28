import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Transaction } from '../../model/transaction.model';
import { Page } from '../../model/page.model';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = environment.baseApiUrl;
  private readonly ENDPOINT = '/api/v1/transactions/user';

  getTransactionsByUserIdPaginated(
    userId: string | number,
    page: number = 0,
    size: number = 20
  ): Observable<Page<Transaction>> {
    const url = `${this.BASE_URL}${this.ENDPOINT}/${userId}/paged`;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<Transaction>>(url, { params });
  }
}
