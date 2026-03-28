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
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationDecisionService } from '../../../app/core/services/navigation-decision.service'
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../app/views/shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-wallet',
  imports: [CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    TranslateModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
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
  private router = inject(Router);
  private updateSubscription!: Subscription;
  constructor(
    private dataService: DataService,
    private navigationDecisionService: NavigationDecisionService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loadWalletsOnInit();
  }

  loadWalletsOnInit(): void {
    const walletsJson = localStorage.getItem('WALLETS');
    // Check if an update is forced OR if the local storage is empty/null
    if (this.dataService.isUpdateRequired() || !walletsJson) {     
      this.fetchWallets();
    } else {     
      // Data exists and no update is required, so load from cache
      this.loadWalletsFromLocalStorage(walletsJson);
    }
  }

  private loadWalletsFromLocalStorage(cachedData: string): void {
    try {
      const loadedWallets = JSON.parse(cachedData) as Wallet[];
      this.wallets.set(loadedWallets);
    } catch (error) {
      console.error("Error parsing wallets from localStorage", error);
      this.fetchWallets(); // Fallback to fetch if JSON is corrupted
    }
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
        if (user!.id) {
          return this.walletService.getWallets();
        }
        // If no userId, return an empty Observable stream to avoid errors
        return of([]);
      })
    ).subscribe({
      next: (data: Wallet[]) => {
        // 'data' contains the Wallet[] returned by getWallets
        this.dataService.walletUpdateCompleted()
        this.wallets.set(data);
        localStorage.setItem('WALLETS', JSON.stringify(data));
      },
      error: (err) => {
        console.error('Error fetching wallets:', err); // Changed 'providers' to 'wallets'
        this.wallets.set([]);
      }
    });
  }

  ngOnDestroy(): void {
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

  navigateToNewWallet() {
    this.router.navigate(['/add-wallet']);
  }

  processTransaction(wallet: Wallet, transactionType: string) {
    this.navigationDecisionService.verifyProfile().subscribe(isComplete => {
      if (isComplete) {

        // 1. Send all required information to the DataService
        this.dataService.updateTransactionRequest({
          "currencyCode": wallet.currencyCode,
          "type": transactionType // 'DEPOSIT' or 'WITHDRAWAL'
        });

        
        this.router.navigate(['/add-transaction']);

      } else {
        console.log('Profile is incomplete. Redirecting to profile page.');
        this.openConfirmDialog();
      }
    });
  }

  openConfirmDialog(): void {
    const dialogData: ConfirmDialogData = {
      title: 'Perfil incompleto',
      message: 'Por favor complete su perfil!'
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.router.navigate(['/profile']);
      }
    });
  }
}
