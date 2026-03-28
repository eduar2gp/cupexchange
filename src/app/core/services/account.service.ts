import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../../model/account.model';
import { build, ApiEndpoints } from '../api/endpoints';
import { ProviderBalance } from '../../model/provider-balance.model';
import { Page } from '../../model/page.model';
import { User } from '../../model/user.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private http = inject(HttpClient);

  addAccount(account: Partial<Account>): Observable<Account> {
    const url = build(ApiEndpoints.account.ADD_ACCOUNT);
    return this.http.post<Account>(url, account);
  }

  getAccounts(user: User): Observable<Account[]> {
    // 1. Build the URL using the userId from the user object
    // Note: ensure the placeholder in your endpoint is {userId}
    const url = build(ApiEndpoints.account.GET_USER_ACCOUNTS, { userId: user.id });
    // 2. Execute the GET request
    return this.http.get<Account[]>(url);
  }

  /**
    * Retrieves paginated provider balances.
    * @param page The page index (starting at 0)
    * @param size The number of records per page
    */
  getAccountProvidersBalances(page: number = 0, size: number = 10): Observable<Page<ProviderBalance>> {
    const url = build(ApiEndpoints.account.ACCOUNT_PROVIDER_BALANCE);

    // Set up query parameters ?page=x&size=y
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<ProviderBalance>>(url, { params });
  }

  getAccountBalance(accountId: number = 0): Observable<ProviderBalance> {
    const url = build(ApiEndpoints.account.GET_ACCOUNT_BALANCE, { accountId: accountId });
    return this.http.get<ProviderBalance>(url);
  }

}