import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MerchantOrder } from '../../../model/merchant-order-response.model';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // Added Paginator

@Component({
  standalone: true,
  selector: 'app-ecommerce-orders-list',
  imports: [
    CommonModule, 
    MatTableModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatPaginatorModule, // Added
    CurrencyPipe
  ],
  templateUrl: './ecommerce-orders-list.component.html',
  styleUrl: './ecommerce-orders-list.component.scss',
})
export class EcommerceOrdersListComponent implements OnInit {
  private merchantOrderService = inject(MerchantOrdersService);

  displayedColumns: string[] = ['total', 'status', 'createdAt'];

  // Signals for Data and Loading
  orders = signal<MerchantOrder[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Signals for Pagination
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  currentPage = signal<number>(0);

  ngOnInit(): void {  
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);

    this.merchantOrderService
      .getAllMerchantOrdersByCustomer(this.currentPage(), this.pageSize())
      .subscribe({
        next: (response) => {
          // Parse the Page object: 'content' contains the array of orders
          this.orders.set(response.content || []);
          this.totalElements.set(response.totalElements || 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set('Failed to load orders.');
          this.isLoading.set(false);
          console.error('Fetch error:', err);
        }
      });
  }

  // Handle page changes from MatPaginator
  handlePageEvent(e: PageEvent) {
    this.pageSize.set(e.pageSize);
    this.currentPage.set(e.pageIndex);
    this.loadOrders();
  }
}