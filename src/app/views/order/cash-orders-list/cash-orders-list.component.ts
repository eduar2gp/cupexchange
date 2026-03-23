import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core'; // Add OnDestroy
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { Page } from '../../../model/page.model';
import { CashOrder } from '../../../model/cash-order-response.model';
import { DataService } from '../../../core/services/data.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cash-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cash-orders-list.component.html',
  styleUrl: './cash-orders-list.component.scss',
})
export class CashOrdersListComponent implements OnInit, OnDestroy { // Added OnDestroy
  displayedColumns: string[] = ['orderId', 'type', 'amount', 'currency', 'status', 'createdAt'];

  dataSource: CashOrder[] = [];
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;

  private destroy$ = new Subject<void>();
  private providerId: string | null = null;

  private dataService = inject(DataService);
  private merchantOrderService = inject(MerchantOrdersService);
  private cdr = inject(ChangeDetectorRef);

  constructor() { }

  ngOnInit(): void {
    this.dataService.currentProvider
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provider) => {
          console.log('Provider received in component:', provider); // Debug log
          if (provider && provider.id) {
            this.providerId = provider.id.toString();
            this.loadOrders();
          }
        },
        error: (err) => console.error('DataService error', err)
      });
  }

  loadOrders(): void {
    if (!this.providerId) {
      console.warn('loadOrders called but providerId is null');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Show spinner immediately

    this.merchantOrderService
      .getCashMerchantOrdersByProviderId(this.providerId, this.currentPage, this.pageSize)
      .subscribe({
        next: (response: Page<CashOrder>) => { // Explicitly type the response
          this.dataSource = response.content || [];
          this.totalElements = response.totalElements || 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('API Error:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}