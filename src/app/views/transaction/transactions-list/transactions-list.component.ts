import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // Add this

import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { Page } from '../../../model/page.model';
import { Transaction } from '../../../model/transaction.model';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatPaginatorModule // Add this
  ],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.css',
})
export class TransactionsListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);

  // Pagination Signals
  transactionsPage = signal<Page<Transaction> | null>(null);
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  
  loading = signal(true);
  error = signal<string | null>(null);

  transactions = computed(() => this.transactionsPage()?.content ?? []);

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    const user = this.authService.currentUser$();
    if (!user) {
      this.error.set('User not authenticated');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.transactionService.getTransactionsByUserIdPaginated(
      user.userId, 
      this.currentPage(), 
      this.pageSize()
    ).subscribe({
      next: (pageData) => {
        this.transactionsPage.set(pageData);
        this.totalElements.set(pageData.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load transactions');
        this.loading.set(false);
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTransactions();
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward',
      'trade_buy': 'shopping_cart',
      'trade_sell': 'sell',
      'fee_collection': 'account_balance_wallet'
    };
    return iconMap[type.toLowerCase()] || 'receipt_long';
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-pending';
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'FAILED':
      case 'REJECT':
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  refresh(): void {
    this.currentPage.set(0);
    this.loadTransactions();
  }
}