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
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cash-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './cash-orders-list.component.html',
  styleUrl: './cash-orders-list.component.scss',
})
export class CashOrdersListComponent implements OnInit, OnDestroy { // Added OnDestroy
  displayedColumns: string[] = ['type', 'amount', 'currency', 'status', 'createdAt', 'actions'];

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

  constructor(private snackBar: MatSnackBar) { }

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

  updateOrderStatus(orderId: number, newStatus: string): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.merchantOrderService
      .updateCashOrderStatus(orderId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Status updated successfully:', response);
          this.showToast("Status updated successfully!", 'Success');
          this.loadOrders();
        },
        error: (err) => {
          console.error('Failed to update status:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
          this.showToast("Status update failed: "+ err.error, 'Error');
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

   private showToast(message: string, type: 'Success' | 'Error'): void {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: type === 'Success' ? ['snackbar-success'] : ['snackbar-error'] });
  }
}