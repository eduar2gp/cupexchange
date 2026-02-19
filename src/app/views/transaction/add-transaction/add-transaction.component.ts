import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

// Service/Model Imports
import { TransactionService } from '../../../core/services/transaction.service';
import { DataService } from '../../../core/services/data.service';
import { Wallet } from '../../../model/wallet.model';
import { TransactionRequest } from '../../../model/transaction-request.model';
import { PaymentGateway } from '../../../model/payment-gateway.model';
import { Account } from '../../../model/account.model';
import { ChangeDetectorRef } from '@angular/core';

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
  transactionAmount: number | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  selectedFile: File | null = null;
  paymentGateways: PaymentGateway[] = [];
  selectedGatewayCode: string | null = null;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  constructor(
    private transactionService: TransactionService,
    private dataService: DataService,
    private router: Router,
    private snackBar: MatSnackBar,
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
    this.cdr.detectChanges();
  }

  /**
   * Logic to disable the submit button based on requirements:
   * 1. Loading state
   * 2. Missing account/gateway
   * 3. No image selected (for DEPOSIT only)
   */
  get isSubmitDisabled(): boolean {
    if (this.isLoading || !this.selectedAccount || !this.selectedGatewayCode) return true;
    
    // Requirement 1: If DEPOSIT and no image selected, disable button
    if (this.transactionRequest?.type === 'DEPOSIT' && !this.selectedFile) {
      return true;
    }
    
    return false;
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
          this.selectGateway(gateways[0]);
        }
        this.cdr.detectChanges();
      });
  }

  getAccountDetails(account: Account) {
    const details = [
      { label: 'Email', value: account.email },
      { label: 'Phone', value: account.phone },
      { label: 'Card', value: account.cardNumber }
    ];
    return details.filter(detail => detail.value !== null && detail.value !== '');
  }

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

  private verifyAvailableBalance(): boolean {
    if (this.transactionRequest?.type !== 'WITHDRAWAL') return true;
    if (this.transactionAmount === null || this.transactionAmount <= 0) return false;

    const targetWallet = this.wallets.find(w => w.currencyCode === this.transactionRequest?.currencyCode);
    if (!targetWallet) return false;

    if (targetWallet.availableBalance >= this.transactionAmount) {
      return true;
    } else {
      this.errorMessage = `Insufficient balance. Available: ${targetWallet.availableBalance} ${targetWallet.currencyCode}.`;
      this.showToast(this.errorMessage, 'Error');
      return false;
    }
  }

  /**
   * Refactored Transaction Submission Flow
   */
  submitTransaction() {
    this.errorMessage = null;

    if (!this.transactionRequest || this.transactionAmount === null || this.transactionAmount <= 0) {
      this.errorMessage = 'Transaction data incomplete.';
      return;
    }

    if (!this.verifyAvailableBalance()) return;

    this.isLoading = true;
    this.transactionRequest.amount = this.transactionAmount;

    // 1. Add Payment
    this.transactionService.addPayment({ accountId: this.selectedAccount!.id })
      .pipe(
        switchMap((paymentResponse) => {
          const paymentId = paymentResponse.id;
          this.transactionRequest!.referenceId = paymentId;

          // 2. If Deposit, call updateReceipt first
          if (this.transactionRequest?.type === 'DEPOSIT' && this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            
            // Requirement 3: call updateReceipt then proceed
            return this.transactionService.updateReceipt(paymentId, formData).pipe(
              switchMap(() => this.finalizeTransaction())
            );
          }

          // For Withdrawal, skip receipt upload
          return this.finalizeTransaction();
        }),
        catchError((error) => {
          this.isLoading = false;
          console.error('Transaction flow failed:', error);
          const userMessage = error.error?.message || 'Transaction failed.';
          this.showToast(userMessage, 'Error');
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

  private finalizeTransaction(): Observable<any> {
    return this.transactionRequest?.type === 'DEPOSIT'
      ? this.transactionService.deposit(this.transactionRequest)
      : this.transactionService.withdrawal(this.transactionRequest!);
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
      console.log('file selected');
    }
  }

  compareAccounts(a1: Account, a2: Account): boolean {
    return a1 && a2 ? a1.id === a2.id : a1 === a2;
  }

  onGatewaySelected(gatewayCode: string): void {
    this.selectedAccount = null;
    this.accounts = [];
    this.isLoading = true;

    const accountObs = this.transactionRequest?.type === 'DEPOSIT'
      ? this.transactionService.getAccountsByGatewayCode(gatewayCode)
      : this.transactionService.getAccountsByUserIdAndGatewayCode(gatewayCode);

    accountObs.pipe(catchError(() => { this.isLoading = false; return of([]); }))
      .subscribe(accounts => {
        this.accounts = accounts;
        this.isLoading = false;
        if (this.accounts.length === 1) {
          this.selectedAccount = this.accounts[0];
        }
        this.cdr.detectChanges();
      });
  }

  selectGateway(gateway: PaymentGateway): void {
    this.selectedGatewayCode = gateway.gatewayCode!;
    this.selectedAccount = null;
    if (this.selectedGatewayCode) {
      this.onGatewaySelected(this.selectedGatewayCode);
    }
    this.cdr.detectChanges();
  }

  selectAccount(account: Account): void {
    this.selectedAccount = account;
    this.cdr.detectChanges();
  }
}