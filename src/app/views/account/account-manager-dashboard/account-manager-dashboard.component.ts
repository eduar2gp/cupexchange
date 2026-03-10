import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Added for ngModel
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field'; // Added
import { MatSelectModule } from '@angular/material/select'; // Added

import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionManagerResponse } from '../../../model/transaction-manager.model';
import { TransactionConfirmDialogComponent } from '../../../views/shared/confirm-transaction-dialog/transaction-confirm-dialog.component';

@Component({
  selector: 'app-account-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatPaginatorModule,
    MatProgressSpinnerModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatDialogModule, MatFormFieldModule, MatSelectModule
  ],
  templateUrl: './account-manager-dashboard.component.html',
  styleUrl: './account-manager-dashboard.component.scss',
})
export class AccountManagerDashboardComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  displayedColumns: string[] = ['type', 'amount', 'actions', 'status', 'timestamp'];
  transactions = signal<TransactionManagerResponse[]>([]);
  isLoading = signal<boolean>(false);
  
  // Status Filter Signal
  statusFilter = signal<string>('ALL'); 

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  // Updated to include status in the request
  loadData(pageIndex: number = this.currentPage, pageSize: number = this.pageSize): void {
    this.isLoading.set(true);
    const status = this.statusFilter() === 'ALL' ? undefined : this.statusFilter();
    
    this.transactionService.getAccountManagerTransactions(pageIndex, pageSize, status)
      .subscribe({
        next: (res) => {
          this.transactions.set(res.content);
          this.totalElements = res.totalElements;
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  onFilterChange() {
    this.currentPage = 0; // Reset to first page on filter change
    this.loadData();
  }

  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData(this.currentPage, this.pageSize);
  }

  onSelectTransaction(tx: TransactionManagerResponse): void {
    const dialogRef = this.dialog.open(TransactionConfirmDialogComponent, {
      width: '400px',
      data: { id: tx.id, type: tx.type },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      // Result is now an object: { action: 'CONFIRM' | 'CANCEL', reason?: string }
      if (result && result.action) {
        this.processAction(tx, result.action, result.reason);
      }
    });
  }

  private processAction(tx: TransactionManagerResponse, action: 'CONFIRM' | 'REJECT', reason?: string): void {
    let actionString: string;

    if (action === 'CONFIRM') {
      // Map to the type-specific backend action
      actionString = tx.type === 'DEPOSIT' ? 'CONFIRM_DEPOSIT' : 'CONFIRM_WITHDRAWAL';
    } else {
      // Map REJECT from UI to CANCEL for the backend
      actionString = 'REJECT';
    }

    this.isLoading.set(true);
    this.transactionService.processTransactionAction({
      transactionId: tx.id,
      action: actionString as any,
      reason: reason || '' // Pass the failure reason from the dialog
    }).subscribe({
      next: () => {
        this.loadData(); // Refresh list to see updated status
      },
      error: (err) => {
        console.error('Action failed', err);
        this.isLoading.set(false);
        // Optional: Add a snackbar/toast here to show the error to the admin
      }
    });
  }
}