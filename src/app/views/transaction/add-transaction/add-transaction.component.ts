import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, switchMap } from 'rxjs/operators';
import { of, Observable, forkJoin } from 'rxjs';

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
import { TranslateModule } from '@ngx-translate/core';

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
    MatSelectModule,
    TranslateModule
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

  // Dual account logic
  userAccounts: Account[] = [];
  providerAccounts: Account[] = [];
  selectedUserAccount: Account | null = null;
  selectedProviderAccount: Account | null = null;

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
  }

  get isSubmitDisabled(): boolean {
    if (this.isLoading) return true;
    if (!this.selectedGatewayCode) return true;
    if (!this.selectedUserAccount) return true;
    if (this.transactionRequest?.type === 'DEPOSIT' && !this.selectedProviderAccount) {
      return true;
    }
    if (this.transactionRequest?.type === 'DEPOSIT' && !this.selectedFile) {
      return true;
    }
    if (this.transactionAmount == 0) return true;
    return false;
  }

  private loadPaymentGateways(currency: string): void {
    this.isLoading = true;
    this.transactionService.getPaymentGateways(currency)
      .pipe(catchError(() => of([])))
      .subscribe(gateways => {
        this.paymentGateways = gateways;
        this.isLoading = false;
        if (gateways.length > 0) {
          this.selectGateway(gateways[0]);
        }
        this.cdr.detectChanges();
      });
  }

  onGatewaySelected(gatewayCode: string): void {
    this.selectedUserAccount = null;
    this.selectedProviderAccount = null;
    this.userAccounts = [];
    this.providerAccounts = [];
    this.isLoading = true;

    const isDeposit = this.transactionRequest?.type === 'DEPOSIT';

    let request$: Observable<any>;

    if (isDeposit) {
      // Deposit requires BOTH user + provider accounts
      request$ = forkJoin({
        user: this.transactionService.getAccountsByUserIdAndGatewayCode(gatewayCode),
        provider: this.transactionService.getAccountsByGatewayCode(gatewayCode)
      });
    } else {
      // Withdrawal only needs user accounts
      request$ = this.transactionService
        .getAccountsByUserIdAndGatewayCode(gatewayCode)
        .pipe(
          switchMap(userAccounts => of({ user: userAccounts, provider: [] }))
        );
    }

    request$
      .pipe(
        catchError(() => {
          this.showToast('Failed to load accounts for this gateway.', 'Error');
          return of({ user: [], provider: [] });
        })
      )
      .subscribe(({ user, provider }) => {
        this.userAccounts = user;
        this.providerAccounts = provider;
        this.isLoading = false;

        if (this.userAccounts.length === 1) {
          this.selectedUserAccount = this.userAccounts[0];
        }

        if (this.providerAccounts.length === 1) {
          this.selectedProviderAccount = this.providerAccounts[0];
        }

        this.cdr.detectChanges();
      });
  }

  submitTransaction() {
    if (!this.transactionRequest || !this.transactionAmount || this.transactionAmount <= 0) return;

    if(!this.verifyAvailableBalance()) return;

    this.isLoading = true;

    // 1. Sync the request object with the current UI state
    this.transactionRequest.amount = this.transactionAmount;
    // this.transactionRequest.currencyCode = this.selectedUserAccount!.currencyCode;

    let fromId: number | null = null;
    let toId: number | null = null;

    if (this.transactionRequest.type === 'DEPOSIT') {
      // Deposit: User -> Provider (User selects both)
      fromId = this.selectedUserAccount!.id;
      toId = this.selectedProviderAccount!.id;
    } else {
      // Withdrawal: System -> User (User only selects their destination)
      fromId = 0; // Or leave null, as backend ignores it for waterfall
      toId = this.selectedUserAccount!.id;
    }

    // 2. Add Payment
    this.transactionService.addPayment({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: this.transactionAmount,
      requestType: this.transactionRequest.type,
      // currencyCode: this.transactionRequest.currencyCode
    })
      .pipe(
        switchMap((paymentResponse) => {
          // Handle potential array response from Waterfall
          const paymentId = Array.isArray(paymentResponse) ? paymentResponse[0].id : paymentResponse.id;

          // 3. Update referenceId for the subsequent 'deposit' call
          this.transactionRequest!.referenceId = paymentId.toString();

          if (this.transactionRequest?.type === 'DEPOSIT') {
            if (this.selectedFile) {
              const formData = new FormData();
              formData.append('file', this.selectedFile);
              return this.transactionService.updateReceipt(paymentId, formData).pipe(
                switchMap(() => this.transactionService.deposit(this.transactionRequest!))
              );
            }
            return this.transactionService.deposit(this.transactionRequest!);
          }

          // Withdrawals are handled entirely by addPayment (the Waterfall)
          return of(paymentResponse);

        }),
        catchError((error) => {
          this.isLoading = false;
          this.showToast(error.error?.details || error.error?.message || 'Transaction failed.', 'Error');
          return of(null);
        })
      )
      .subscribe((finalResponse) => {
        this.isLoading = false;
        if (finalResponse) {
          this.showToast(`${this.transactionRequest?.type} processed successfully!`, 'Success');
          this.router.navigate(['/transactions']);
        }
      });
  }

  // UI Helper Methods
  selectGateway(gateway: PaymentGateway): void {
    this.selectedGatewayCode = gateway.gatewayCode!;
    this.onGatewaySelected(this.selectedGatewayCode);
  }

  selectUserAccount(account: Account): void { this.selectedUserAccount = account; }
  selectProviderAccount(account: Account): void { this.selectedProviderAccount = account; }

  getAccountDetails(account: Account) {
    return [
      { label: 'Name', value: account.accountName },
      { label: 'Email', value: account.email },
      { label: 'Phone', value: account.phone },
      { label: 'Card', value: account.cardNumber },
      { label: 'Id', value: account.accountId }
    ].filter(d => d.value);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  private loadWallets(): void {
    const walletsJson = localStorage.getItem('WALLETS');
    if (walletsJson) this.wallets = JSON.parse(walletsJson);
  }

  private verifyAvailableBalance(): boolean {
    if (this.transactionRequest?.type !== 'WITHDRAWAL') return true;
    const wallet = this.wallets.find(w => w.currencyCode === this.transactionRequest?.currencyCode);
    if (!wallet || wallet.availableBalance < (this.transactionAmount || 0)) {
      this.showToast('Insufficient balance.', 'Error');
      return false;
    }
    return true;
  }

  private showToast(message: string, type: 'Success' | 'Error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'Success' ? ['snackbar-success'] : ['snackbar-error']
    });
  }

  navigateToNewAccount() {
    this.router.navigate(['/add-account']);
  }
}