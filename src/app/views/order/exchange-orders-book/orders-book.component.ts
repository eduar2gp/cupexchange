import { Component, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy, Inject, signal, WritableSignal, computed, Signal, Input, PLATFORM_ID } from '@angular/core';
import { CommonModule, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { WebSocketService } from '../../../core/services/websocket.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';
import { OrdersService } from '../../../core/services/orders.service';
import { Subscription, forkJoin } from 'rxjs';
import { TradingPair } from '../../../model/trading_pair';
import { PublicOrderDTO } from '../../../model/public_order_dto';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { first } from 'rxjs/operators';

export type LayoutMode = 'stacked' | 'side-by-side' | 'mixed';

@Component({
  selector: 'app-order-book',
  standalone: true,
  imports: [CommonModule, MatCardModule, DecimalPipe, TranslateModule],
  templateUrl: './orders-book.component.html',
  styleUrl: './orders-book.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderBookComponent implements OnInit, OnDestroy {
  // 1. STATE: Separate WritableSignals for Buy and Sell data
  private ordersSignalBuy: WritableSignal<PublicOrderDTO[]> = signal([]);
  private ordersSignalSell: WritableSignal<PublicOrderDTO[]> = signal([]);

  @Input() layoutMode: LayoutMode = 'side-by-side';
  @Input() MAX_ORDERS_ITEMS: number = 50;

  public currentPairSignal: WritableSignal<TradingPair | null> = signal(null);
  private?: Subscription;

  private pairSub!: Subscription;

  // 2. COMPUTED: Derived signals for the template
  public buyOrders = computed(() => {
    return this.ordersSignalBuy()
      .filter(o => o.type !== 'MARKET')
      .sort((a, b) => this.parsePrice(b.price) - this.parsePrice(a.price)) // Descending
      .slice(0, this.MAX_ORDERS_ITEMS);
  });

  public sellOrders = computed(() => {
    return this.ordersSignalSell()
      .filter(o => o.type !== 'MARKET')
      .sort((a, b) => this.parsePrice(a.price) - this.parsePrice(b.price)) // Ascending
      .slice(0, this.MAX_ORDERS_ITEMS);
  });

  public priceFormat = computed(() => {
    const pair = this.currentPairSignal();
    if (pair?.viewValue === 'CUP') return '1.2-4';
    if (pair?.viewValue === 'USD') return '1.0-0';
    return '1.2-2';
  });

  private isBrowser: boolean;

  constructor(
    private wsService: WebSocketService,
    private pairSelectionService: PairSelectionService,
    private orderService: OrdersService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      const startingPair = this.pairSelectionService.getCurrentPair();
      if (startingPair) {
        this.currentPairSignal.set(startingPair);
        this.loadInitialOrders(startingPair.value);
        this.wsService.subscribeToRecentOrders(startingPair.value);
      }

      this.pairSub = this.pairSelectionService.selectedPair$.subscribe(pair => {
        if (!pair) return;
        const current = this.currentPairSignal();
        if (!current || current.value !== pair.value) {
          this.currentPairSignal.set(pair);
          this.loadInitialOrders(pair.value);
          this.wsService.subscribeToRecentOrders(pair.value);
        }
      });

      this.wsService.recentOrders$.subscribe((order: PublicOrderDTO) => {
        // Only run UI updates inside NgZone in the browser
        this.ngZone.run(() => this.upsertOrder(order));
      });
    }
  }

  private loadInitialOrders(pair: string): void {
    const limit = this.MAX_ORDERS_ITEMS || 5;
    console.log(`OrderBook: Requesting ${pair} ${limit} items`);

    forkJoin({
      buy: this.orderService.findTopNByPairCodeAndSide(pair, 'BUY', limit).pipe(
        first(), // 👈 Ensure completion
        catchError(err => {
          console.error('OrderBook BUY Error:', err.message);
          return of([]);
        })
      ),
      sell: this.orderService.findTopNByPairCodeAndSide(pair, 'SELL', limit).pipe(
        first(), // 👈 Ensure completion
        catchError(err => {
          console.error('OrderBook SELL Error:', err.message);
          return of([]);
        })
      )
    }).subscribe({
      next: (res) => {
        console.log('OrderBook: Success', res);
        this.ordersSignalBuy.set(res.buy || []);
        this.ordersSignalSell.set(res.sell || []);
      },
      error: (err) => console.error('OrderBook: Critical forkJoin failure', err)
    });
  }

  private upsertOrder(newOrder: PublicOrderDTO): void {
    // Determine which signal to update
    const targetSignal = newOrder.side === 'BUY' ? this.ordersSignalBuy : this.ordersSignalSell;

    targetSignal.update(orders => {
      const index = orders.findIndex(o => o.orderId === newOrder.orderId);

      // If order is finished/cancelled, you might want to remove it
      if (newOrder.status === 'FILLED' || newOrder.status === 'CANCELED') {
        return orders.filter(o => o.orderId !== newOrder.orderId);
      }

      if (index !== -1) {
        return orders.map((order, i) => (i === index ? newOrder : order));
      } else {
        return [newOrder, ...orders];
      }
    });
  }

  private parsePrice(p: any): number {
    if (typeof p === 'number') return p;
    if (typeof p === 'string') return parseFloat(p.replace(/,/g, '')) || 0;
    return 0;
  }

  ngOnDestroy(): void {
    this.pairSub?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      this.wsService.unsubscribeFromRecentOrders();
    }
  }

  get layoutClasses() {
    return {
      'stacked': this.layoutMode === 'stacked',
      'side-by-side': this.layoutMode === 'side-by-side',
    };
  }
}
