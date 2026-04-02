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

import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

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
  private dataService = inject(DataService)
  private router = inject(Router)

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

    this.dataService.updateTransaction(tx)
    this.router.navigate(['transaction-details'])

  }

}