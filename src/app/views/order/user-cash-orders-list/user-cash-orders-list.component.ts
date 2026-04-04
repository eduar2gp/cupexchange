import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { CashOrder } from '../../../model/cash-order-response.model';
import { Page } from '../../../model/page.model';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-user-cash-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './user-cash-orders-list.component.html',
  styleUrl: './user-cash-orders-list.component.scss',
})
export class UserCashOrdersListComponent implements OnInit {
  private merchantOrderService = inject(MerchantOrdersService);

  // Signals
  dataSource = signal<CashOrder[]>([]);
  isLoading = signal<boolean>(false);
  
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);

  // Required for mat-table
  displayedColumns: string[] = ['amount', 'status', 'createdAt'];

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.isLoading.set(true);

    this.merchantOrderService
      .getCashMerchantOrdersByUserId(this.currentPage(), this.pageSize())
      .subscribe({
        next: (response: Page<CashOrder>) => {
          this.dataSource.set(response.content || []);
          this.totalElements.set(response.totalElements || 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('API Error:', err);
          this.isLoading.set(false);
        },
      });
  }

  handlePageEvent(e: PageEvent): void {
    this.pageSize.set(e.pageSize);
    this.currentPage.set(e.pageIndex);
    this.fetchOrders();
  }
}