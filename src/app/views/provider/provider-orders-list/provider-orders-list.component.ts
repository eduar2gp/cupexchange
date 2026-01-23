import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { MerchantOrder } from '../../../model/merchant-order-reponse.model';
import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service'
import { Router } from '@angular/router';

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
    UpperCasePipe
  ],
})
export class ProviderOrdersListComponent implements OnInit {
  private merchantOrderService = inject(MerchantOrdersService);
  private authService = inject(AuthService);
  private dataService = inject(DataService)
  private router = inject(Router);

  // Signals for reactive UI state
  orders = signal<MerchantOrder[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Table configuration
  displayedColumns: string[] = ['id', 'customerId', 'status', 'total', 'paid'];

  ngOnInit() {
    this.loadProviderOrders();
  }

  loadProviderOrders() {
    const user = this.authService.getCurrentUser();

    if (user && user.providerId) {
      this.isLoading.set(true);
      this.merchantOrderService.getAllMerchantOrdersByProvider(user.providerId)
        .subscribe({
          next: (response) => {
            this.orders.set(response || []);
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

  onClick(merchantOrder: MerchantOrder) {
    this.dataService.updateMerchantOrder(merchantOrder)
    this.router.navigate(['merchant-order-details'])
  }
}
