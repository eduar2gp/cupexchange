import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MerchantOrder } from '../../../model/merchant-order-reponse.model';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { CurrencyPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-ecommerce-orders-list',
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, MatChipsModule, CurrencyPipe],
  templateUrl: './ecommerce-orders-list.component.html',
  styleUrl: './ecommerce-orders-list.component.scss',
})
export class EcommerceOrdersListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'status', 'total', 'paid'];

  private merchantOrderService = inject(MerchantOrdersService);

  // Define Signals
  orders = signal<MerchantOrder[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {  
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);

    this.merchantOrderService.getAllMerchantOrdersByCustomer().subscribe({
      next: (response) => {
        // Update signals using .set()
        this.orders.set(response || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load orders.');
        this.isLoading.set(false);
        console.error('Fetch error:', err);
      }
    });
  }
}
