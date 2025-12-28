import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment'
import { Wallet } from '../../model/wallet.model'
import { AuthService } from '../../core/services/auth.service'
import { DataService } from '../../core/services/data.service'

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

  private WALLETS_ENDPOINT = '/api/v1/trade/account/balance?userId=';
  

  //private dataService:  any
  constructor(dataService: DataService) {
    //this.dataService = dataService;
  }

  getWallets(userId: string): Observable<Wallet[]> {
    const fullUrl = `${environment.baseApiUrl}${this.WALLETS_ENDPOINT}` + userId;
    return this.http.get<Wallet[]>(fullUrl);
  }

  triggerUpdate() {
    console.log('WalletUpdateService: Triggering update...');
    this.updateSource.next(); // Emit a value to notify subscribers
  }

}
