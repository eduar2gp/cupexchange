import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../../model/account.model';
import { build, ApiEndpoints } from '../api/endpoints';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private http = inject(HttpClient);

  addAccount(account: Partial<Account>): Observable<Account> {
    const url = build(ApiEndpoints.account.ADD_ACCOUNT);
    return this.http.post<Account>(url, account);
  }
  
}