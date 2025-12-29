import { OrdersService } from '../../../core/services/orders.service'
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { OrderPlaced } from '../../../model/order_placed.model'; // your refined interface
import { OnInit, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { WritableSignal } from '@angular/core';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent {
  private ordersService = inject(OrdersService);

  constructor(    
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Reactive state using signals
  orders: WritableSignal<OrderPlaced[]> = signal<OrderPlaced[]>([] as OrderPlaced[]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Derived state: sorted or filtered if needed
  displayedOrders = computed(() =>
    this.orders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

 
  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      // During prerender/SSR: skip call, use empty/placeholder data
      this.orders.set([]); // or [{ placeholder: true }]
      return;
    }

    // Browser only: safe to call (user may be authenticated)
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ordersService.getOrdersFromExchangeBackend().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.error.set('Failed to load orders. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  // Optional: refresh method (e.g., pull-to-refresh or button)
  refresh(): void {
    this.loadOrders();
  }
}
