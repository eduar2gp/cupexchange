import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionManagerResponse } from '../../../model/transaction-manager.model';
import { TransactionConfirmDialogComponent } from '../../../views/shared/confirm-transaction-dialog/transaction-confirm-dialog.component';

@Component({
  selector: 'app-account-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, 
    MatProgressSpinnerModule, MatButtonModule, MatIconModule, 
    MatChipsModule, MatDialogModule
  ],
  templateUrl: './account-manager-dashboard.component.html',
  styleUrl: './account-manager-dashboard.component.scss',
})
export class AccountManagerDashboardComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  displayedColumns: string[] = ['id', 'referenceId', 'type', 'amount', 'status', 'timestamp', 'actions'];
  transactions = signal<TransactionManagerResponse[]>([]);
  isLoading = signal<boolean>(false);

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  loadData(pageIndex: number = this.currentPage, pageSize: number = this.pageSize): void {
    this.isLoading.set(true);
    // Note: Use actual user ID from your auth service in production
    this.transactionService.getAccountManagerTransactions(pageIndex, pageSize)
      .subscribe({
        next: (res) => {
          this.transactions.set(res.content);
          this.totalElements = res.totalElements;
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  onSelectTransaction(tx: TransactionManagerResponse): void {
    const dialogRef = this.dialog.open(TransactionConfirmDialogComponent, {
      width: '400px',
      data: { id: tx.id, type: tx.type },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'CONFIRM' || result === 'REJECT') {
        this.processAction(tx, result);
      }
    });
  }

  private processAction(tx: TransactionManagerResponse, decision: 'CONFIRM' | 'REJECT'): void {
    const actionString = `${decision}_${tx.type}`; // e.g., CONFIRM_DEPOSIT
    
    this.isLoading.set(true);
    this.transactionService.processTransactionAction({
      transactionId: tx.id,
      action: actionString as any
    }).subscribe({
      next: () => {
        this.loadData(); // Refresh list to see updated status
      },
      error: (err) => {
        console.error('Action failed', err);
        this.isLoading.set(false);
      }
    });
  }

  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData(this.currentPage, this.pageSize);
  }
}