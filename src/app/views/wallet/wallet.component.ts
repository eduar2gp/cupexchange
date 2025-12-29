import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { WalletService } from '../../core/services/wallet.service'
import { Wallet } from '../../model/wallet.model'
import { DataService } from '../../core/services/data.service'
import { switchMap, filter } from 'rxjs/operators';
import { take, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { CRYPTO_SYMBOLS } from '../../configs/currency.constants';

@Component({
  standalone: true,
  selector: 'app-wallet',
  imports: [CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.css',
})
export class WalletComponent implements OnInit, OnDestroy {

  private readonly CURRENCY_NAMES: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
    BNB: 'Binance Coin',
    SOL: 'Solana',
    XRP: 'Ripple',
    ADA: 'Cardano',
    DOGE: 'Dogecoin',
    DOT: 'Polkadot'
  };

  private walletService = inject(WalletService);   
  wallets = signal<Wallet[]>([]);
  private updateSubscription!: Subscription;
    constructor(private dataService: DataService) {}

   ngOnInit(): void {
     this.fetchWallets();
     // 2. Subscribe to the update stream
     this.updateSubscription = this.walletService.update$.subscribe(() => {
       console.log('WalletComponent: Reloading wallets triggered by service.');
       this.fetchWallets(); // Reload the data
     });
   }  

  fetchWallets(): void {
    // 1. Get the Observable stream of the current user
    this.dataService.currentUser.pipe(
      // Ensure we don't proceed if the user is null
      filter(user => user !== null),
      // Ensure the stream completes after receiving the first non-null user
      // This prevents the wallet fetch from running again if the user object changes
      take(1),
      // Switch the User Observable to the Wallet[] Observable
      switchMap(user => {
        // 'user' here is the actual User object, not the Observable
        if (user!.userId) {
          return this.walletService.getWallets(user!.userId);
        }
        // If no userId, return an empty Observable stream to avoid errors
        return of([]);
      })
    ).subscribe({
      next: (data: Wallet[]) => {
        // 'data' contains the Wallet[] returned by getWallets
        this.wallets.set(data);
      },
      error: (err) => {
        console.error('Error fetching wallets:', err); // Changed 'providers' to 'wallets'
        this.wallets.set([]);
      }
    });
  }

  ngOnDestroy(): void {
    // CRITICAL: Unsubscribe to prevent memory leaks
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  getCurrencySymbol(currencyCode: string | undefined): string {
    const code = currencyCode?.toUpperCase();
    return code ? (CRYPTO_SYMBOLS[code] ?? code.slice(0, 2)) : '?';
  }

  getCurrencyName(currencyCode: string | undefined): string {
    const code = currencyCode?.toUpperCase();
    return code ? (this.CURRENCY_NAMES[code] ?? currencyCode) : 'Unknown Currency';
  }

  calculateProgress(wallet: any): number {
    if (!wallet.balance || wallet.balance === 0) return 0;
    return (wallet.availableBalance / wallet.balance) * 100;
  }

}
