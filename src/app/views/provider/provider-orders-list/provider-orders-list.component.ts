import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';

import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { MerchantOrder } from '../../../model/merchant-order-response.model';
import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service'
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-provider-orders-list',
  templateUrl: './provider-orders-list.component.html',
  styleUrl: './provider-orders-list.component.scss',
  imports: [
    CommonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CurrencyPipe,
    UpperCasePipe,
    MatPaginatorModule,
    MatIconModule
  ],
})
export class ProviderOrdersListComponent implements OnInit, OnDestroy {
  private merchantOrderService = inject(MerchantOrdersService);
  private authService = inject(AuthService);
  private dataService = inject(DataService);
  private router = inject(Router);

  // Signals for reactive UI state
  orders = signal<MerchantOrder[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  
  // Pagination State
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);

  // Cleanup
  private destroy$ = new Subject<void>();

  // Table configuration
  displayedColumns: string[] = ['id', 'customerId', 'status', 'total', 'paid', 'actions'];

  ngOnInit() {
    this.loadProviderOrders();
  }

  loadProviderOrders() {
    const user = this.authService.getCurrentUser();

    if (user && user.providerId) {
      this.isLoading.set(true);
      
      this.merchantOrderService
        .getAllMerchantOrdersByProvider(
          user.providerId, 
          this.currentPage(), 
          this.pageSize()
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (pageResponse) => {
            // response is typed as Page<MerchantOrder>
            this.orders.set(pageResponse.content || []);
            this.totalElements.set(pageResponse.totalElements || 0);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error fetching provider orders:', err);
            this.errorMessage.set('Failed to load merchant orders.');
            this.isLoading.set(false);
          }
        });
    } else {
      this.errorMessage.set('Provider information not found.');
      this.isLoading.set(false);
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProviderOrders();
  }

  onClick(merchantOrder: MerchantOrder) {
    this.dataService.updateMerchantOrder(merchantOrder);
    this.router.navigate(['merchant-order-details']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
