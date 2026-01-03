import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { Wallet } from '../../../model/wallet.model';
import { TradingPair } from '../../../model/trading_pair';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-add-wallet', 
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './currencies.component.html',
  styleUrls: ['./currencies.component.scss']
})
export class CurrenciesComponent implements OnInit {
  availableCurrencies: TradingPair[] = [];
  existingCurrencies: TradingPair[] = [];
  allCurrencies: TradingPair[] = [];
  wallets: Wallet[] = [];

  constructor(
    private dialog: MatDialog,
    private walletService: WalletService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef // Optional: for extra safety
  ) { }

  ngOnInit(): void {
    this.loadDataFromStorage();
  }

  private loadDataFromStorage(): void {
    // --- 1. Load Data from Local Storage ---
    const walletsJson = localStorage.getItem('WALLETS');
    this.wallets = walletsJson ? JSON.parse(walletsJson) as Wallet[] : [];

    const pairsJson = localStorage.getItem('CURRENCIES_PAIRS');
    this.allCurrencies = pairsJson ? JSON.parse(pairsJson) as TradingPair[] : [];

    // --- 2. Create Set of Existing Wallet Currency Codes for efficient lookup ---
    // This Set contains unique currency codes from the user's wallets (e.g., {'CUP', 'USD'})
    const walletCurrencyCodes = new Set(this.wallets.map(w => w.currencyCode));

    // --- 3. Filter and Separate Trading Pairs using a Map for uniqueness ---

    // A Map is used to store existing currencies temporarily, keyed by the unique currency code (viewValue).
    // This guarantees no duplicate entries in the list of existing currencies.
    const uniqueExistingCurrenciesMap = new Map<string, TradingPair>();
    this.availableCurrencies = [];

    // Iterate through all possible currency options
    for (const pair of this.allCurrencies) {
      const currencyCode = pair.viewValue;

      if (walletCurrencyCodes.has(currencyCode)) {
        // Currency already has an existing wallet.
        // Check the map before adding. If the key already exists, do nothing (i.e., prevent duplicate).
        if (!uniqueExistingCurrenciesMap.has(currencyCode)) {
          uniqueExistingCurrenciesMap.set(currencyCode, pair);
        }
      } else {
        // Currency does not yet have an existing wallet.
        this.availableCurrencies.push(pair);
      }
    }

    // --- 4. Convert the unique Map entries back to the final array ---
    this.existingCurrencies = Array.from(uniqueExistingCurrenciesMap.values());
  }

  onCurrencySelect(pair: TradingPair): void {
    this.openConfirmDialog(pair);
  }

  openConfirmDialog(pair: TradingPair): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirmar!',
      message: `¿Crear billetera para ${pair.viewValue}?`
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.walletService.createWallet(pair.viewValue).subscribe({
          next: (newWallet: Wallet) => {
            // 1. Update localStorage
            const wallets: Wallet[] = this.wallets; // already loaded
            wallets.push(newWallet);
            localStorage.setItem('WALLETS', JSON.stringify(wallets));

            // 2. CRITICAL: Update component state to avoid ExpressionChanged error
            this.availableCurrencies = this.availableCurrencies.filter(
              p => p.viewValue !== pair.viewValue
            );

            // Optional: trigger change detection if needed (rarely necessary)
            // this.cdr.detectChanges();

            // 3. Show success message
            this.snackBar.open(
              `Billetera ${pair.viewValue} creada exitosamente`,
              'OK',
              { duration: 4000, panelClass: ['success-snackbar'] }
            );

            // 4. Navigate
            this.router.navigate(['/wallet']);
          },
          error: (err: Error) => {
            let errorMsg = err.message || 'Error al crear la billetera';
            if (errorMsg.includes('already exists') || errorMsg.includes('ya existe')) {
              errorMsg = `Ya tienes una billetera para ${pair.viewValue}`;
            }
            this.snackBar.open(errorMsg, 'OK', {
              duration: 6000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
