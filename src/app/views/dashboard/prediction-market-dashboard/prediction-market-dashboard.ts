import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { PredictionCategory } from '../../../model/prediction-category.model';
import { PredictionEventResponse } from '../../../model/prediction-event.model';
import { PredictionMarketResponse } from '../../../model/prediction-market.model';
import { PredictionOrderResponse } from '../../../model/prediction-order-response.model';

@Component({
  selector: 'app-prediction-market-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './prediction-market-dashboard.html',
  styleUrl: './prediction-market-dashboard.scss',
})
export class PredictionMarketDashboard implements OnInit {
  private readonly predictionMarketService = inject(PredictionMarketService);

  readonly categories = signal<PredictionCategory[]>([]);
  readonly events = signal<PredictionEventResponse[]>([]);
  readonly markets = signal<PredictionMarketResponse[]>([]);
  readonly orders = signal<PredictionOrderResponse[]>([]);
  readonly selectedEvent = signal<PredictionEventResponse | null>(null);
  readonly isLoadingCategories = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly isLoadingMarkets = signal(false);
  readonly isLoadingOrders = signal(false);
  readonly errorMessage = signal<string | null>(null);

  selectedIndex = 0;
  readonly displayedColumns = [
    'orderId',
    'side',
    'outcomePosition',
    'price',
    'quantity',
    'filledQuantity',
    'status',
    'createdAt',
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.errorMessage.set(null);

    this.predictionMarketService.getPredictionCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);

        if (categories.length > 0) {
          this.loadEvents(categories[0].id);
        }
      },
      error: (error) => {
        console.error('Failed to load prediction market categories', error);
        this.errorMessage.set('Failed to load prediction market categories.');
        this.isLoadingCategories.set(false);
      },
    });
  }

  onTabChange(index: number): void {
    const category = this.categories()[index];
    this.selectedIndex = index;
    this.events.set([]);
    this.markets.set([]);
    this.orders.set([]);
    this.selectedEvent.set(null);

    if (category) {
      this.loadEvents(category.id);
    }
  }

  selectEvent(event: PredictionEventResponse): void {
    this.selectedEvent.set(event);
    this.markets.set([]);
    this.orders.set([]);
    this.loadMarkets(event.id);
    this.loadOrders(event.id);
  }

  private loadEvents(categoryId: number): void {
    this.isLoadingEvents.set(true);
    this.errorMessage.set(null);

    this.predictionMarketService.getPredictionEvents(categoryId).subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoadingEvents.set(false);
      },
      error: (error) => {
        console.error('Failed to load prediction events', error);
        this.errorMessage.set('Failed to load prediction events.');
        this.isLoadingEvents.set(false);
      },
    });
  }

  private loadMarkets(eventId: number): void {
    this.isLoadingMarkets.set(true);
    this.errorMessage.set(null);

    this.predictionMarketService.getPredictionMarkets(eventId).subscribe({
      next: (markets) => {
        if (this.selectedEvent()?.id === eventId) {
          this.markets.set(markets);
          this.isLoadingMarkets.set(false);
        }
      },
      error: (error) => {
        if (this.selectedEvent()?.id === eventId) {
          console.error('Failed to load prediction markets', error);
          this.errorMessage.set('Failed to load prediction markets.');
          this.isLoadingMarkets.set(false);
        }
      },
    });
  }

  private loadOrders(eventId: number): void {
    this.isLoadingOrders.set(true);
    this.errorMessage.set(null);

    this.predictionMarketService.getPredictionOrders(eventId).subscribe({
      next: (orders) => {
        if (this.selectedEvent()?.id === eventId) {
          this.orders.set(orders);
          this.isLoadingOrders.set(false);
        }
      },
      error: (error) => {
        if (this.selectedEvent()?.id === eventId) {
          console.error('Failed to load prediction orders', error);
          this.errorMessage.set('Failed to load prediction orders.');
          this.isLoadingOrders.set(false);
        }
      },
    });
  }
}
