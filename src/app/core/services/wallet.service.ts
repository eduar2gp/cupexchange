import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment'
import { Wallet } from '../../model/wallet.model'
import { TradingPair } from '../../../app/model/trading_pair';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  // Use a Subject to act as the communication channel
  private updateSource = new Subject<void>();

  // Expose the Observable stream for other components to subscribe to
  update$ = this.updateSource.asObservable();

  private http = inject(HttpClient);

  //private authService = inject(AuthService);
  //user = this.authService.currentUserValue;

  private WALLETS_ENDPOINT = '/api/v1/wallet/balance';
  private CURRENCIES_PAIRS = '/api/v1/trade/currencies/pairs';
  private ADD_WALLET = '/api/v1/wallet/add'
  constructor() {
  }

  getWallets(): Observable<Wallet[]> {
    const fullUrl = `${environment.baseApiUrl}${this.WALLETS_ENDPOINT}`;
    return this.http.get<Wallet[]>(fullUrl);
  }

  getCurrenciesPairs(): Observable<TradingPair[]> {
    const fullUrl = `${environment.baseApiUrl}${this.CURRENCIES_PAIRS}`;
    return this.http.get<TradingPair[]>(fullUrl);
  }

  triggerUpdate() {
    console.log('WalletUpdateService: Triggering update...');
    this.updateSource.next(); // Emit a value to notify subscribers
  }

  createWallet(currencyCode: string): Observable<Wallet> {
    const fullUrl = `${environment.baseApiUrl}${this.ADD_WALLET}`;
    const payload = { currencyCode };
    return this.http.post<Wallet>(fullUrl, payload).pipe(
      map((response: Wallet) => {
        // Success: 201 Created → server returns the new Wallet object
        console.log('Wallet created successfully:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Failed to create wallet';
        if (error.status === 400) {
          // Specific handling for "already exists"
          if (error.error?.details?.includes('already exists')) {
            errorMessage = `Wallet for currency ${currencyCode} already exists.`;
          } else {
            errorMessage = error.error?.details || error.error?.message || errorMessage;
          }
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (error.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        // Return a user-friendly error as Observable
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
