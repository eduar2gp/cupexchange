import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, filter } from 'rxjs/operators'; 
import { of } from 'rxjs';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';

import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { Transaction } from '../../../model/transaction.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatPaginatorModule,
    TranslateModule
  ],
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.scss'],
})
export class TransactionsListComponent {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);

  // State Signals
  pageSize = signal(10);
  currentPage = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  // 1. Create a computed object for our parameters
  // We define the type explicitly so 'p' isn't unknown in the pipe
  private paramsSignal = computed(() => ({
    user: this.authService.currentUser$(), // Ensure this is a signal in your service
    page: this.currentPage(),
    size: this.pageSize()
  }));

  // 2. The Reactive Pipe
  private transactionsResource = toSignal(
    toObservable(this.paramsSignal).pipe(
      // The filter prevents the API call if user is null
      filter((p): p is { user: any; page: number; size: number } => !!p.user),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(p => 
        this.transactionService.getTransactionsByUserIdPaginated(
          p.user.userId, 
          p.page, 
          p.size
        ).pipe(
          catchError(() => {
            this.error.set('Failed to load transactions');
            return of(null);
          }),
          tap(() => this.loading.set(false))
        )
      )
    ),
    { initialValue: null }
  );

  // 3. Selectors for the Template
  transactions = computed(() => this.transactionsResource()?.content ?? []);
  totalElements = computed(() => this.transactionsResource()?.totalElements ?? 0);

  handlePageEvent(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  trackById(index: number, item: Transaction) {
    return item?.id;
  }

  getTypeIcon(type?: string): string {
    const iconMap: Record<string, string> = {
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward',
      'TRADE_DEBIT': 'arrow_downward',
      'trade_buy': 'shopping_cart',
      'trade_sell': 'sell',
      'fee_collection': 'account_balance_wallet'
    };
    return iconMap[(type || '').toLowerCase()] || 'receipt_long';
  }

  getTypeClass(type?: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'DEPOSIT') return 'deposit';
    if (t === 'WITHDRAWAL') return 'withdrawal';
    if (t.includes('TRADE')) return 'trade';
    if (t.includes('FEE')) return 'fee';
    return 'neutral';
  }

  getAmountClass(type?: string): string {
    const t = (type || '').toUpperCase();
    return (t === 'DEPOSIT') ? 'positive' : (t === 'WITHDRAWAL' || t.includes('FEE')) ? 'negative' : 'neutral-amount';
  }

  getStatusClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED') return 'status-completed';
    if (['FAILED', 'REJECT', 'CANCELLED'].includes(s)) return 'status-cancelled';
    return 'status-pending';
  }

  isDepositOrWithdrawal(type?: string): boolean {
    const t = (type || '').toUpperCase();
    return t === 'DEPOSIT' || t === 'WITHDRAWAL';
  }

  isWithdrawal(type?: string): boolean {
    return (type || '').toUpperCase() === 'WITHDRAWAL' || (type || '').toUpperCase() === 'TRADE_CREDIT' || (type || '').toUpperCase() === 'FEE_PAYMENT';
  }

  refresh(): void {
    // Simply resetting the signal triggers the logic above
    this.currentPage.set(0);
  }
}