import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  PLATFORM_ID,
  Inject,
  computed,
  WritableSignal,
  signal,
  effect
} from '@angular/core';
import { CommonModule, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

import { WebSocketService } from '../../core/services/websocket.service';
import { PublicTradeDto } from '../../model/public-trade-dto.model';
import { PairSelectionService } from '../../core/services/pair-selection.service';
import { TradeService } from '../../core/services/trade.service';
import { TradingPair } from '../../model/trading_pair';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-recent-trades',
  templateUrl: './recent-trades.component.html',
  styleUrls: ['./recent-trades.component.scss'],
  imports: [CommonModule, MatCardModule, DecimalPipe, TranslateModule],
})
export class RecentTradesComponent implements OnInit, OnDestroy {

  // Signals
  private tradesSignal: WritableSignal<PublicTradeDto[]> = signal([]);
  public trades = this.tradesSignal;

  public currentPairSignal: WritableSignal<TradingPair | null> = signal(null);

  private maxTrades = 11;
  private tradeSub!: Subscription;

  private currentPair!: TradingPair;
  private currentPage = 0;
  private isBrowser: boolean;

  constructor(
    private wsService: WebSocketService,
    private pairSelectionService: PairSelectionService,
    private ngZone: NgZone,
    private tradeService: TradeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    effect(() => {
      const pair: TradingPair | null = this.pairSelectionService.selectedPair();
      if (!pair) return;

      // Only update if pair changed
      if (!this.currentPair || pair.value !== this.currentPair.value) {
        this.currentPair = pair;
        this.currentPairSignal.set(pair);
        this.tradesSignal.set([]);

        // 🟢 FIX: Only interact with WS and API if we are in the browser
        if (this.isBrowser) {
          this.loadRecentTrades();
          this.wsService.subscribeToPublicTrades(pair.value);
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    
    // 1️⃣ Initialize current pair from computed signal
    const pair = this.pairSelectionService.selectedPair();
    if (pair) {
      this.currentPair = pair;
      this.currentPairSignal.set(pair);
    }

    

    setTimeout(() => {
      this.loadRecentTrades();

      this.subscribeToNewTrades();

      if (this.currentPair?.value) {
        this.wsService.subscribeToPublicTrades(this.currentPair.value);
      }
    }, 0);
  }



  // =========================
  // INITIAL LOAD
  // =========================
  private loadRecentTrades(): void {
    if (!this.currentPair?.value) return;

    this.tradeService
      .getRecentTradesPaged(this.currentPair.value, this.currentPage, 50)
      .subscribe({
        next: (response) => {
          this.tradesSignal.update(trades => {
            const updated = [...response.content, ...trades];
            return updated.slice(0, this.maxTrades);
          });
        },
        error: (err) => {
          console.error(`Error loading trades for ${this.currentPair?.value}:`, err);
        }
      });
  }

  // =========================
  // SOCKET UPDATES
  // =========================
  private subscribeToNewTrades(): void {
    if (!this.isBrowser) return;

    this.tradeSub = this.wsService.publicTrades$.subscribe((newTrades: PublicTradeDto[]) => {
      this.ngZone.run(() => {
        const filteredTrades = newTrades.filter(
          t => t.pair === this.currentPair?.value
        );

        if (!filteredTrades.length) return;

        this.tradesSignal.update(trades => {
          const updated = [...filteredTrades, ...trades];
          return updated.slice(0, this.maxTrades);
        });
      });
    });
  }

  // =========================
  // HELPERS
  // =========================
  formatTime(timestamp: string | number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }



  trackByTrade(index: number, trade: PublicTradeDto): string {
  // Use trade.id if it exists, otherwise combine timestamp + price + volume + index
  if (trade.id != null) {
    return String(trade.id);
  }
  return `${trade.timestamp}_${trade.price}_${trade.volume}_${index}`;
}

  public priceFormat = computed(() => {
    const pair = this.currentPairSignal();
    if (pair?.viewValue === 'CUP') return '1.2-4';
    if (pair?.viewValue === 'USD') return '1.0-0';
    return '1.2-2';
  });

  ngOnDestroy(): void {
    this.tradeSub?.unsubscribe();

    if (this.isBrowser) {
      this.wsService.unsubscribeFromPublicTrades();
    }
  }
}