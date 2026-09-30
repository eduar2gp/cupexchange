import { Component, Input, OnDestroy, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PredictionPosition } from '../../model/prediction-position.model';
import { PredictionMarketService } from '../../core/services/prediction-market.service';

@Component({
  selector: 'app-prediction-position',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './prediction-position.component.html',
  styleUrl: './prediction-position.component.scss',
})
export class PredictionPositionComponent implements OnDestroy {
  readonly positions = signal<PredictionPosition[]>([]);
  readonly loading = signal(false);

  readonly displayedColumns: string[] = [
    'outcomePosition',
    'quantity',
    'avgPrice',
    'totalCost',
    'realizedPnl',
    'updatedAt',
  ];

  private positionsSubscription?: Subscription;

  constructor(private readonly predictionMarketService: PredictionMarketService) {}

  @Input({ required: true })
  set predictionMarketId(predictionMarketId: number) {
    this.positionsSubscription?.unsubscribe();

    if (!Number.isInteger(predictionMarketId) || predictionMarketId <= 0) {
      this.positions.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.positionsSubscription = this.predictionMarketService
      .getPredictionPositions(predictionMarketId)
      .subscribe({
        next: (positions) => {
          this.positions.set(positions);
          this.loading.set(false);
        },
        error: () => {
          this.positions.set([]);
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.positionsSubscription?.unsubscribe();
  }
}