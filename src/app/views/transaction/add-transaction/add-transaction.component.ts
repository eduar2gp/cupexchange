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
    MatSnackBarModule
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

  constructor(
    private transactionService: TransactionService,
    private dataService: DataService,
    private router: Router,
    private snackBar: MatSnackBar // Inject MatSnackBar for feedback
  ) { }

  ngOnInit(): void {
    // 1. Get TransactionRequest from dataService
    this.transactionRequest = this.dataService.getCurrentTransactionRequest();

    // Load wallets immediately
    this.loadWallets();

    if (!this.transactionRequest) {
      this.showToast('Transaction details missing. Redirecting to start page.', 'Error');
      this.router.navigate(['/wallet']);
      return;
    }

    // Initialize transactionAmount if it's not already set
    if (!this.transactionRequest.amount) {
      // This is a placeholder; in a real app, this should be pre-filled or handled by the form.
      this.transactionAmount = 0;
    } else {
      this.transactionAmount = this.transactionRequest.amount;
    }
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

    // Check 1: Final data check
    if (!this.transactionRequest || this.transactionAmount === null || this.transactionAmount <= 0) {
      this.errorMessage = 'Transaction data incomplete.';
      return;
    }

    // Update the request with the final amount from the form
    this.transactionRequest.amount = this.transactionAmount;

    // Check 2: Balance verification for withdrawals
    if (this.transactionRequest.type === 'WITHDRAWAL' && !this.verifyAvailableBalance()) {
      // The verification function already sets the error message and shows a toast
      return;
    }

    this.isLoading = true;

    // Determine which service method to call
    const transactionObservable =
      this.transactionRequest.type === 'DEPOSIT'
        ? this.transactionService.deposit(this.transactionRequest)
        : this.transactionService.withdrawal(this.transactionRequest);

    transactionObservable.pipe(
      catchError(error => {
        this.isLoading = false;
        console.error('Transaction failed:', error);
        // Use the error message from the response body if available
        const userMessage = error.error?.message || 'Transaction failed due to a server error.';
        this.errorMessage = userMessage;

        // Pass 'Error' literal string
        this.showToast(userMessage, 'Error');
        return of(null);
      })
    ).subscribe(response => {
      this.isLoading = false;
      if (response) {
        // Pass 'Success' literal string
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
}
