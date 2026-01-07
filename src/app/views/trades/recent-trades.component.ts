import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { WebSocketService } from '../../core/services/websocket.service';
import { PublicTradeDto } from '../../model/public-trade-dto.model'
import { PairSelectionService } from '../../core/services/pair-selection.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common'; // isPlatformBrowser imported
import { TradeService } from '../../core/services/trade.service';
import { Observable } from 'rxjs'; // Observable needed for subscription
import { TradingPair } from '../../model/trading_pair'

@Component({
  standalone: true,
  selector: 'app-recent-trades',
  templateUrl: './recent-trades.component.html',
  styleUrls: ['./recent-trades.component.css'],
  imports: []  
})
export class RecentTradesComponent implements OnInit, OnDestroy {

  trades: PublicTradeDto[] = [];
  private maxTrades = 50; // Limit the visible trades for performance/readability

  private tradeSub!: Subscription;
  private pairSub!: Subscription;

  // Initialize with a default value, expecting pairSelectionService to update it
  private currentPair!: TradingPair;

  private currentPage = 0; // Pagination page number
  private isBrowser: boolean; // For SSR safety

  constructor(
    private wsService: WebSocketService,
    private pairSelectionService: PairSelectionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private tradeService: TradeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // 1. Initial Load: Get the current pair and load trades
    this.currentPair = this.pairSelectionService.getCurrentPair() || this.currentPair;

    // Only proceed with data loading and sockets if we are in the browser
    if (this.isBrowser) {
      this.loadRecentTrades();
      this.subscribeToPairChanges();
      this.subscribeToNewTrades();
      this.wsService.subscribeToPublicTrades(this.currentPair.value); // Initial socket subscription
    }
  }

  private subscribeToPairChanges(): void {
    // 2. Subscribe to pair changes
    this.pairSub = this.pairSelectionService.selectedPair$.subscribe(pair => {
      if (pair && pair !== this.currentPair) {

        this.wsService.unsubscribeFromPublicTrades(); // Unsubscribe old pair's trades

        this.currentPair = pair;
        this.trades = []; // Clear old trades

        // Load initial trades for the new pair
        this.loadRecentTrades();

        // Subscribe to socket for the new pair
        this.wsService.subscribeToPublicTrades(pair.value);

        console.log(`RecentTrades switched to pair: ${pair}`);
      }
    });
  }

  private subscribeToNewTrades(): void {
    // 3. Subscribe to trades for the current pair
    this.tradeSub = this.wsService.publicTrades$.subscribe((newTrades: PublicTradeDto[]) => {
      // Run inside NgZone for performance and to trigger Angular change detection
      this.ngZone.run(() => {

        // Only process trades for the active pair
        const filteredTrades = newTrades.filter(t => t.pair === this.currentPair.value);

        // 4. PREPEND the new trades (real-time data is newest and goes on top)
        this.trades.unshift(...filteredTrades);

        // 5. Limit the list size
        if (this.trades.length > this.maxTrades) {
          this.trades.splice(this.maxTrades); // Remove oldest trades from the end
        }

        this.cdr.detectChanges();
      });
    });
  }

  loadRecentTrades(): void {
    // 6. HTTP Load: Load the initial set of trades (page 0, size 20)
    this.tradeService.getRecentTradesPaged(this.currentPair.value, this.currentPage, 20)
      .subscribe({
        next: (response) => {
          // 7. APPEND the historical trades (historical data is oldest and goes on bottom)
          // The API returns trades newest first, but for an initial load that will be *followed* // by real-time data, it's often better to add them newest-first or reverse the list 
          // to maintain correct chronological order if you are loading a specific page.

          // Assuming the goal is to show the 20 most recent trades immediately, 
          // we use the content directly. Since socket trades are PREPENDED, 
          // we insert the API trades at the top.
          this.trades.unshift(...response.content);

          if (this.trades.length > this.maxTrades) {
            this.trades.splice(this.maxTrades);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(`Error loading recent trades for ${this.currentPair}:`, err);
        }
      });
  }

  ngOnDestroy(): void {
    this.tradeSub?.unsubscribe();
    this.pairSub?.unsubscribe();

    if (this.isBrowser) {
      this.wsService.unsubscribeFromPublicTrades();
    }
  }

  /**
  * Helper function to format the timestamp for the x-axis label.
  */
  formatTime(timestamp: string | number): string { // <-- THIS IS THE PROBLEM
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Helper for *ngFor optimization
  trackByTimestamp(index: number, trade: PublicTradeDto): string {
    return trade.timestamp;
  }
}
