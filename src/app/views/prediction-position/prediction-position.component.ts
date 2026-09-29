import { Component, Input, OnDestroy, signal } from '@angular/core';
import { PredictionPosition } from '../../model/prediction-position.model';
import { PredictionMarketService } from '../../core/services/prediction-market.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-prediction-position',
  imports: [],
  templateUrl: './prediction-position.component.html',
  styleUrl: './prediction-position.component.scss',
})
export class PredictionPositionComponent implements OnDestroy {
  readonly positions = signal<PredictionPosition[]>([]);
  readonly loading = signal(false);

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
