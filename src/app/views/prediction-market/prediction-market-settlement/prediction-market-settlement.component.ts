import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, take } from 'rxjs';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { PredictionCategory } from '../../../model/prediction-category.model';
import { PredictionEventResponse } from '../../../model/prediction-event.model';
import { PredictionMarketResponse } from '../../../model/prediction-market.model';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-prediction-market-settlement',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatMenuModule],
  templateUrl: './prediction-market-settlement.component.html',
  styleUrl: './prediction-market-settlement.component.scss',
})
export class PredictionMarketSettlementComponent implements OnInit {
  private readonly predictionMarketService = inject(PredictionMarketService);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = signal<PredictionCategory[]>([]);
  readonly events = signal<PredictionEventResponse[]>([]);
  readonly markets = signal<PredictionMarketResponse[]>([]);
  readonly selectedCategory = signal<PredictionCategory | null>(null);
  readonly selectedEvent = signal<PredictionEventResponse | null>(null);
  readonly selectedMarket = signal<PredictionMarketResponse | null>(null);

  readonly isLoadingCategories = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly isLoadingMarkets = signal(false);
  readonly settlingMarketId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);

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
          this.selectCategory(categories[0]);
        }
      },
      error: (error) => {
        console.error('Failed to load prediction market categories', error);
        this.errorMessage.set('Failed to load prediction market categories.');
        this.isLoadingCategories.set(false);
      },
    });
  }

  selectCategory(category: PredictionCategory): void {
    this.selectedCategory.set(category);
    this.events.set([]);
    this.markets.set([]);
    this.selectedEvent.set(null);
    this.selectedMarket.set(null);
    this.loadEvents(category.id);
  }

  selectEvent(event: PredictionEventResponse): void {
    this.selectedEvent.set(event);
    this.markets.set([]);
    this.selectedMarket.set(null);
    this.loadMarkets(event.id);
  }

  selectMarket(market: PredictionMarketResponse): void {
    this.selectedMarket.set(market);
  }

  settleMarket(market: PredictionMarketResponse, winningOutcome: 'Yes' | 'No'): void {
    if (this.settlingMarketId() !== null) {
      return;
    }

    this.settlingMarketId.set(market.id);
    this.predictionMarketService.postPredictionMarketSettlement(market.id, winningOutcome).pipe(
      take(1),
      finalize(() => this.settlingMarketId.set(null)),
    ).subscribe({
      next: () => {
        this.selectedMarket.set(market);
        this.snackBar.open(`Market "${market.question}" settled successfully.`, 'Close', { duration: 3000 });

        const event = this.selectedEvent();
        if (event) {
          this.loadMarkets(event.id);
        }
      },
      error: (error) => {
        console.error(`Failed to settle prediction market ${market.id}`, error);
        this.snackBar.open('Failed to settle prediction market.', 'Close', { duration: 4000 });
      },
    });
  }

  private loadEvents(categoryId: number): void {
    this.isLoadingEvents.set(true);
    this.errorMessage.set(null);

    this.predictionMarketService.getPredictionEvents(categoryId).subscribe({
      next: (events) => {
        if (this.selectedCategory()?.id === categoryId) {
          this.events.set(events);
          this.isLoadingEvents.set(false);

          if (events.length > 0) {
            this.selectEvent(events[0]);
          }
        }
      },
      error: (error) => {
        if (this.selectedCategory()?.id === categoryId) {
          console.error('Failed to load prediction events', error);
          this.errorMessage.set('Failed to load prediction events.');
          this.isLoadingEvents.set(false);
        }
      },
    });
  }

  private loadMarkets(eventId: number): void {
    this.isLoadingMarkets.set(true);
    this.errorMessage.set(null);

    const preferredCurrency = (localStorage.getItem('MERCHANT_PRICE_CURRENCY') || 'USD').toUpperCase();
    this.predictionMarketService.getPredictionMarkets(eventId, preferredCurrency).subscribe({
      next: (markets) => {
        if (this.selectedEvent()?.id === eventId) {
          this.markets.set(markets);
          this.isLoadingMarkets.set(false);

          if (markets.length > 0) {
            this.selectedMarket.set(markets.find((market) => market.id === this.selectedMarket()?.id) ?? markets[0]);
          } else {
            this.selectedMarket.set(null);
          }
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

  getCategoryIcon(categoryName: string | undefined | null): string {
    const normalizedName = (categoryName ?? '').toLowerCase();
    return normalizedName.includes('tennis') ? 'sports_tennis' : 'sports_baseball';
  }
}
