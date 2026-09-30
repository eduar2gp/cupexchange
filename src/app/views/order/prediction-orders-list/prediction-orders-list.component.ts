import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { PredictionOrderResponse } from '../../../model/prediction-order-response.model';

@Component({
  selector: 'app-prediction-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './prediction-orders-list.component.html',
  styleUrl: './prediction-orders-list.component.scss',
})
export class PredictionOrdersListComponent implements OnInit {
  private readonly predictionMarketService = inject(PredictionMarketService);

  readonly orders = signal<PredictionOrderResponse[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly filterOptions = ['ALL', 'PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED'];
  readonly selectedStatusFilter = signal<string>('ALL');

  readonly displayedColumns: string[] = [
    'market',
    'sidePosition',
    'price',
    'quantity',
    'status',
    'createdAt'
  ];

  readonly filteredOrders = computed(() => {
    const filter = this.selectedStatusFilter();
    const currentOrders = this.orders();
    if (filter === 'ALL') return currentOrders;
    return currentOrders.filter((o) => o.status === filter);
  });

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.predictionMarketService.getPredictionOrdersByUserId().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.errorMessage.set('Failed to load orders. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter.set(status);
  }
}