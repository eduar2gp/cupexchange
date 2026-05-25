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
import { ProvidersService } from '../../../core/services/providers.service';
import { Wallet } from '../../../model/wallet.model';
import { TransactionRequest } from '../../../model/transaction-request.model';
import { PaymentGateway } from '../../../model/payment-gateway.model';
import { Account } from '../../../model/account.model';
import { Provider, CashAccount } from '../../../model/provider.model';
import { TranslateModule } from '@ngx-translate/core';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { CashOrderRequestDTO } from '../../../model/cash-order-request.model';
import { User } from '../../../model/user.model';

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

  // Transaction State
  transactionRequest: TransactionRequest | null = null;
  wallets: Wallet[] = [];
  transactionAmount: number | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  selectedFile: File | null = null;

  // Payment Method Logic
  paymentMethods = ['CASH', 'BANK', 'WALLET'];
  selectedMethod: string | null = null;

  // Gateway Logic
  allPaymentGateways: PaymentGateway[] = [];
  filteredGateways: PaymentGateway[] = [];
  selectedGatewayCode: string | null = null;
  selectedGatewayMethod: string | null = null;

  // Provider (Cash) Logic
  providers: Provider[] = [];
  selectedProvider: Provider | null = null;
  selectedCashAccounts: CashAccount[] = []; // Cash accounts filtered by currency

  // Account logic (Bank/Wallet)
  userAccounts: Account[] = [];
  providerAccounts: Account[] = [];
  selectedUserAccount: Account | null = null;
  selectedProviderAccount: Account | null = null;

  user: User | null = null;

  constructor(
    private transactionService: TransactionService,
    private dataService: DataService,
    private providersService: ProvidersService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private merchantOrderService: MerchantOrdersService
  ) { }

  ngOnInit(): void {
    this.transactionRequest = this.dataService.getCurrentTransactionRequest();
    this.user = this.dataService.getCurrentUserValue();
    this.loadWallets();

    if (!this.transactionRequest) {
      this.showToast('Transaction details missing. Redirecting...', 'Error');
      this.router.navigate(['/wallet']);
      return;
    }

    this.setAvailablePaymentMethods(this.transactionRequest.currencyCode);
    this.transactionAmount = this.transactionRequest.amount || 0;

    // 1. Get Municipality ID and Load Cash Providers
    const currentUser = this.dataService.getCurrentUserValue();
    if (currentUser?.municipalityId) {
      this.loadCashProviders(currentUser.municipalityId);
    }

    // 2. Load all available gateways for the currency
    this.loadPaymentGateways(this.transactionRequest.currencyCode!);
  }

  private setAvailablePaymentMethods(currencyCode: string | undefined): void {
    switch (currencyCode) {
      case 'CUP':
        this.paymentMethods = ['CASH', 'BANK'];
        break;
      case 'MLC':
        this.paymentMethods = ['BANK'];
        break;
      case 'USD':
        this.paymentMethods = ['CASH', 'BANK', 'WALLET'];
        break;
      default:
        this.paymentMethods = ['BANK']; // Safe fallback
    }
    if (this.paymentMethods.length === 1) {
      this.selectPaymentMethod(this.paymentMethods[0]);
    }
  }

  /**
   * Loads providers filtered by Municipality for the CASH flow
   */
  private loadCashProviders(municipalityId: number): void {
    this.providersService.getProvidersByMunicipalityId(municipalityId)
      .pipe(catchError(() => of({ content: [] })))
      .subscribe(response => {
        this.providers = response.content;
        this.cdr.detectChanges();
      });
  }

  /**
   * Filters payment gateways based on the top-level method (BANK vs WALLET)
   */
  selectPaymentMethod(method: string): void {
    this.selectedMethod = method;
    this.resetSelections();

    if (method !== 'CASH') {
      this.filteredGateways = this.allPaymentGateways.filter(
        g => g.method?.toUpperCase() === method
      );
    }
  }

  private resetSelections(): void {
    this.selectedGatewayCode = null;
    this.selectedGatewayMethod = null;
    this.selectedProvider = null;
    this.selectedCashAccounts = [];
    this.selectedUserAccount = null;
    this.selectedProviderAccount = null;
    this.userAccounts = [];
    this.providerAccounts = [];
  }

  private loadPaymentGateways(currency: string): void {
    this.isLoading = true;
    this.transactionService.getPaymentGateways(currency)
      .pipe(catchError(() => of([])))
      .subscribe(gateways => {
        this.allPaymentGateways = gateways;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  selectProvider(provider: Provider): void {
    this.selectedProvider = provider;
    // Filter cash accounts by the current currency
    if (provider.cashAccounts && this.transactionRequest?.currencyCode) {
      this.selectedCashAccounts = provider.cashAccounts.filter(
        ca => ca.currencyCode === this.transactionRequest?.currencyCode
      );
    } else {
      this.selectedCashAccounts = [];
    }
    this.cdr.detectChanges();
  }

  get isSubmitDisabled(): boolean {
    if (this.isLoading) return true;
    if (this.transactionAmount === null || this.transactionAmount <= 0) return true;
    if (this.selectedMethod === 'CASH') {
      return !this.selectedProvider; // Must have a provider for Cash orders
    }
    // Bank/Wallet logic
    if (!this.selectedGatewayCode || !this.selectedUserAccount) return true;
    if (this.transactionRequest?.type === 'DEPOSIT' && (!this.selectedProviderAccount || !this.selectedFile)) {
      return true;
    }

    return false;
  }

  onGatewaySelected(gatewayCode: string): void {
    this.isLoading = true;
    const isDeposit = this.transactionRequest?.type === 'DEPOSIT';

    const request$ = isDeposit
      ? forkJoin({
        user: this.transactionService.getAccountsByUserIdAndGatewayCode(gatewayCode),
        provider: this.transactionService.getAccountsByGatewayCode(gatewayCode)
      })
      : this.transactionService.getAccountsByUserIdAndGatewayCode(gatewayCode).pipe(
        switchMap(user => of({ user, provider: [] }))
      );

    request$.pipe(catchError(() => of({ user: [], provider: [] })))
      .subscribe(({ user, provider }) => {
        this.userAccounts = user;
        this.providerAccounts = provider;
        this.isLoading = false;
        if (this.userAccounts.length === 1) this.selectedUserAccount = this.userAccounts[0];
        if (this.providerAccounts.length === 1) this.selectedProviderAccount = this.providerAccounts[0];
        this.cdr.detectChanges();
      });
  }

  submitTransaction() {
    if (!this.transactionRequest || !this.transactionAmount || !this.verifyAvailableBalance()) return;

    this.isLoading = true;
    this.transactionRequest.amount = this.transactionAmount;

    // --- NEW: CASH ORDER LOGIC ---
    if (this.selectedMethod === 'CASH') {
      this.handleCashOrder();
      return;
    }

    // --- EXISTING: BANK/WALLET LOGIC ---
    let payload: any = {
      amount: this.transactionAmount,
      requestType: this.transactionRequest.type,
      method: this.selectedMethod
    };

    payload.fromAccountId = this.transactionRequest.type === 'DEPOSIT' ? this.selectedUserAccount?.id : 0;
    payload.toAccountId = this.transactionRequest.type === 'DEPOSIT' ? this.selectedProviderAccount?.id : this.selectedUserAccount?.id;

    this.transactionService.addPayment(payload)
      .pipe(
        switchMap((paymentResponse: any) => {
          const paymentId = Array.isArray(paymentResponse) ? paymentResponse[0].id : paymentResponse.id;
          this.transactionRequest!.referenceId = paymentId.toString();

          if (this.transactionRequest?.type === 'DEPOSIT' && this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            return this.transactionService.updateReceipt(paymentId, formData).pipe(
              switchMap(() => this.transactionService.deposit(this.transactionRequest!))
            );
          }
          return this.transactionRequest?.type === 'DEPOSIT'
            ? this.transactionService.deposit(this.transactionRequest!)
            : of(paymentResponse);
        }),
        catchError((error) => {
          this.isLoading = false;
          this.showToast(error.error?.details || 'Transaction failed.', 'Error');
          return of(null);
        })
      )
      .subscribe((final) => {
        this.isLoading = false;
        if (final) {
          this.showToast('Transaction processed successfully!', 'Success');
          this.router.navigate(['/transactions']);
        }
      });
  }

  private handleCashOrder(): void {
    // Safety check: Ensure the user object exists to get the ID
    const currentUser = this.dataService.getCurrentUserValue();

    if (!currentUser || !this.selectedProvider) {
      this.showToast('Missing user or provider information.', 'Error');
      this.isLoading = false;
      return;
    }

    const cashOrderPayload: CashOrderRequestDTO = {
      // Use the actual user ID from the user session/service
      userId: this.user!.id,
      providerId: this.selectedProvider.id!,
      amount: this.transactionAmount!,
      currencyCode: this.transactionRequest!.currencyCode!,
      type: this.transactionRequest!.type!
    };

    this.merchantOrderService.createCashOrder(cashOrderPayload)
      .pipe(
        catchError((error) => {
          this.isLoading = false;
          // Standardized error handling
          const msg = error.error?.available || 'Cash order failed.';
          const title = error.error?.error || 'Error';
          this.showToast(msg, title);
          return of(null);
        })
      )
      .subscribe((response) => {
        this.isLoading = false;
        if (response) {
          this.showToast('Cash order created successfully!', 'Success');
          this.router.navigate(['/orders'], {
            queryParams: { tab: 1 }
          });
        }
      });
  }

  // --- UI Helpers ---
  selectGateway(gateway: PaymentGateway): void {
    this.selectedGatewayCode = gateway.gatewayCode!;
    this.selectedGatewayMethod = gateway.method!;
    this.onGatewaySelected(this.selectedGatewayCode);
  }

  selectUserAccount(account: Account): void { this.selectedUserAccount = account; }
  selectProviderAccount(account: Account): void { this.selectedProviderAccount = account; }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  private loadWallets(): void {
    const walletsJson = localStorage.getItem('WALLETS');
    if (walletsJson) this.wallets = JSON.parse(walletsJson);
  }

  getWithdrawalFeeForProvider(provider: Provider): number | undefined {
    if (!provider.cashAccounts || !this.transactionRequest?.currencyCode) {
      return undefined;
    }
    const matchingCashAccount = provider.cashAccounts.find(
      ca => ca.currencyCode === this.transactionRequest?.currencyCode
    );
    return matchingCashAccount?.withdrawalPercentageFee;
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
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: type === 'Success' ? ['snackbar-success'] : ['snackbar-error'] });
  }

  getAccountDetails(account: Account) {
    return [
      { label: 'Name', value: account.accountName },
      { label: 'Card', value: account.cardNumber },
      { label: 'Id', value: account.accountId }
    ].filter(d => d.value);
  }

  navigateToNewAccount() { this.router.navigate(['/add-account']); }
}