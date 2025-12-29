import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TransactionService } from '../../../core/services/transaction.service';
import { Page } from '../../../model/page.model'
import { Transaction } from '../../../model/transaction.model';
import { AuthService } from '../../../core/services/auth.service'; // Adjust path as needed

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.css',
})
export class TransactionsListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);

  // State signals
  transactionsPage = signal<Page<Transaction> | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Derived: list of transactions
  transactions = computed(() => this.transactionsPage()?.content ?? []);

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(page: number = 0, size: number = 20): void {
    const user = this.authService.currentUser$(); // ← Note the () !

    if (!user) {
      this.error.set('User not authenticated');
      this.loading.set(false);
      return;
    }

    const userId = user.userId; // or user.id depending on your User interface

    this.loading.set(true);
    this.error.set(null);

    this.transactionService.getTransactionsByUserIdPaginated(userId, page, size)
      .subscribe({
        next: (pageData) => {
          this.transactionsPage.set(pageData);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading transactions', err);
          this.error.set('Failed to load transactions');
          this.loading.set(false);
        }
      });
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'deposit': 'arrow_downward',
      'withdrawal': 'arrow_upward',
      'transfer': 'swap_horiz',
      'payment': 'payment',
      'refund': 'assignment_return',
      'purchase': 'shopping_cart',
      'fee': 'attach_money'
    };

    return iconMap[type.toLowerCase()] || 'receipt_long';
  }

  refresh(): void {
    this.loadTransactions();
  }
}
