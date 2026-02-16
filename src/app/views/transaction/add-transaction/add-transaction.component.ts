import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Required for template forms

// Angular Material Imports (for a basic submission form/feedback)
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Service/Model Imports (assuming relative paths)
import { TransactionService } from '../../../core/services/transaction.service';
import { DataService } from '../../../core/services/data.service';
import { Wallet } from '../../../model/wallet.model';
import { TransactionRequest } from '../../../model/transaction-request.model';

import { MatSelectModule } from '@angular/material/select'; // Add this to imports
import { PaymentGateway } from '../../../model/payment-gateway.model';
import { Account } from '../../../model/account.model';
import { ChangeDetectorRef } from '@angular/core';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './add-transaction.component.html',
  styleUrl: './add-transaction.component.scss',
})
export class AddTransactionComponent implements OnInit {

  transactionRequest: TransactionRequest | null = null;
  wallets: Wallet[] = [];
  transactionAmount: number | null = null; // Amount is crucial for verification
  errorMessage: string | null = null;
  isLoading: boolean = false;
  selectedFile: File | null = null;
  paymentGateways: PaymentGateway[] = []; // Store fetched gateways
  selectedGatewayCode: string | null = null; // Track selection
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  constructor(
    private transactionService: TransactionService,
    private dataService: DataService,
    private router: Router,
    private snackBar: MatSnackBar, // Inject MatSnackBar for feedback
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.transactionRequest = this.dataService.getCurrentTransactionRequest();
    this.loadWallets();

    if (!this.transactionRequest) {
      this.showToast('Transaction details missing. Redirecting...', 'Error');
      this.router.navigate(['/wallet']);
      return;
    }

    this.transactionAmount = this.transactionRequest.amount || 0;
    this.loadPaymentGateways(this.transactionRequest.currencyCode!);

    // ADD THIS LINE HERE
    this.cdr.detectChanges();
  }

  private loadPaymentGateways(currency: string): void {
    this.isLoading = true;
    this.transactionService.getPaymentGateways(currency)
      .pipe(
        catchError(err => {
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe(gateways => {
        this.paymentGateways = gateways;
        this.isLoading = false;

        if (gateways.length > 0) {
          // Force selection and trigger the account load
          this.selectGateway(gateways[0]);
        }

        this.cdr.detectChanges(); // 3. Force UI refresh
      });
  }

  // Utility to get only non-null values for the grid display
  getAccountDetails(account: Account) {
    const details = [
      { label: 'Email', value: account.email },
      { label: 'Phone', value: account.phone },
      { label: 'Card', value: account.cardNumber }
    ];
    return details.filter(detail => detail.value !== null && detail.value !== '');
  }



  /**
   * Loads wallet data from localStorage.
   */
  private loadWallets(): void {
    const walletsJson = localStorage.getItem('WALLETS');
    if (walletsJson) {
      try {
        this.wallets = JSON.parse(walletsJson) as Wallet[];
      } catch (e) {
        console.error('Error parsing wallets from localStorage', e);
      }
    }
  }

  /**
   * Verifies if the requested withdrawal amount is available.
   * @returns true if valid, false otherwise.
   */
  private verifyAvailableBalance(): boolean {
    if (this.transactionRequest?.type !== 'WITHDRAWAL') {
      return true; // No balance check needed for deposits
    }

    if (this.transactionAmount === null || this.transactionAmount <= 0) {
      this.errorMessage = 'Please enter a valid amount.';
      return false;
    }

    const targetWallet = this.wallets.find(
      w => w.currencyCode === this.transactionRequest?.currencyCode
    );

    if (!targetWallet) {
      this.errorMessage = `Wallet for ${this.transactionRequest?.currencyCode} not found.`;
      return false;
    }

    // Perform the balance check
    if (targetWallet.availableBalance >= this.transactionAmount) {
      return true;
    } else {
      this.errorMessage = `Insufficient balance. Available: ${targetWallet.availableBalance} ${targetWallet.currencyCode}.`;
      this.showToast(this.errorMessage, 'Error');
      return false;
    }
  }

  /**
   * Submits the transaction (Deposit or Withdrawal).
   */
  submitTransaction() {
    this.errorMessage = null;

    // 1. Validation checks
    if (!this.transactionRequest || this.transactionAmount === null || this.transactionAmount <= 0) {
      this.errorMessage = 'Transaction data incomplete.';
      return;
    }

    if (!this.selectedGatewayCode || !this.selectedAccount) {
      this.errorMessage = 'Please select a payment gateway and account.';
      return;
    }

    this.isLoading = true;
    this.transactionRequest.amount = this.transactionAmount;

    // 2. Start the chain: Add Payment first
    this.transactionService.addPayment({ accountId: this.selectedAccount.id })
      .pipe(
        switchMap((paymentResponse) => {
          // 3. Inject the referenceId from the payment response
          if (this.transactionRequest) {
            this.transactionRequest.referenceId = paymentResponse.id;
          }

          // 4. Determine and return the next observable (Deposit or Withdrawal)
          return this.transactionRequest?.type === 'DEPOSIT'
            ? this.transactionService.deposit(this.transactionRequest)
            : this.transactionService.withdrawal(this.transactionRequest!);
        }),
        catchError((error) => {
          this.isLoading = false;
          console.error('Transaction flow failed:', error);
          const userMessage = error.error?.message || 'Transaction failed.';
          this.showToast(userMessage, 'Error');
          // Return 'of(null)' to complete the stream gracefully on error
          return of(null);
        })
      )
      .subscribe((finalResponse) => {
        this.isLoading = false;
        if (finalResponse) {
          this.showToast(`${this.transactionRequest?.type} successful!`, 'Success');
          this.router.navigate(['/transactions']);
        }
      });
  }

  private showToast(message: string, type: 'Success' | 'Error'): void {
    const panelClass = type === 'Success' ? 'snackbar-success' : 'snackbar-error';
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [panelClass]
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('file selected')
    }
  }

  // Helper to compare Account objects for the mat-select dropdown
  compareAccounts(a1: Account, a2: Account): boolean {
    return a1 && a2 ? a1.id === a2.id : a1 === a2;
  }

  onGatewaySelected(gatewayCode: string): void {
    this.selectedAccount = null;
    this.accounts = [];
    this.isLoading = true;

    if (this.transactionRequest?.type === 'DEPOSIT') {
      this.transactionService.getAccountsByGatewayCode(gatewayCode)
        .pipe(catchError(() => { this.isLoading = false; return of([]); }))
        .subscribe(accounts => {
          this.accounts = accounts;
          this.isLoading = false;
          if (this.accounts.length === 1) {
            this.selectedAccount = this.accounts[0];
          }
          // MOVE DETECTION TO THE BOTTOM
          this.cdr.detectChanges();
        });
    }
    else {
      this.transactionService.getAccountsByUserIdAndGatewayCode(gatewayCode)
        .pipe(catchError(() => { this.isLoading = false; return of([]); }))
        .subscribe(accounts => {
          this.accounts = accounts;
          this.isLoading = false;
          if (this.accounts.length === 1) {
            this.selectedAccount = this.accounts[0];
          }
          // MOVE DETECTION TO THE BOTTOM
          this.cdr.detectChanges();
        });
    }

  }

  // Inside AddTransactionComponent class

  selectGateway(gateway: PaymentGateway): void {
    this.selectedGatewayCode = gateway.gatewayCode!;
    this.selectedAccount = null;

    if (this.selectedGatewayCode) {
      this.onGatewaySelected(this.selectedGatewayCode);
    }
    this.cdr.detectChanges(); // Refresh gateway selection UI
  }

  selectAccount(account: Account): void {
    this.selectedAccount = account;
    this.cdr.detectChanges(); // Refresh account selection UI
  }
}