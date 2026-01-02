import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, Inject } from '@angular/core';
import { WebSocketService, PublicOrderDTO } from '../../../core/services/websocket.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';
import { OrdersService } from '../../../core/services/orders.service';
import { Subscription } from 'rxjs';
import { TradingPair } from '../../../model/trading_pair';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-order-book',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './orders-book.component.html',
  styleUrl: './orders-book.component.css',
})
export class OrderBookComponent implements OnInit, OnDestroy {
  orders: PublicOrderDTO[] = [];
  currentPair!: TradingPair;
  private pairSub?: Subscription; // Optional with ?

  constructor(
    private wsService: WebSocketService,
    private pairSelectionService: PairSelectionService,
    private orderService: OrdersService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Always load initial orders via HTTP (safe on both server and browser)
    const initialPair = this.pairSelectionService.getCurrentPair();
    const pairCode = initialPair?.value || 'USDCUP';

    this.loadInitialOrders(pairCode);

    // === BROWSER-ONLY LOGIC ===
    if (isPlatformBrowser(this.platformId)) {
      // Subscribe to WebSocket for real-time updates
      this.wsService.subscribeToRecentOrders(pairCode);

      // Subscribe to pair selection changes
      this.pairSub = this.pairSelectionService.selectedPair$.subscribe(pair => {
        if (pair) {
          this.loadInitialOrders(pair.value);
          this.wsService.subscribeToRecentOrders(pair.value);
        }
      });

      // Listen to real-time order updates from WebSocket
      this.wsService.recentOrders$.subscribe((order: PublicOrderDTO) => {
        this.ngZone.run(() => {
          this.upsertOrder(order);
          this.cdr.detectChanges();
        });
      });
    }
    // On server: orders will remain empty or loaded from HTTP only → safe for prerender
  }

  private loadInitialOrders(pair: string): void {
    this.orderService.findTopNByPairCode(pair, 100).subscribe({
      next: (initialOrders: PublicOrderDTO[]) => {
        this.ngZone.run(() => {
          this.orders = initialOrders
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 100); // Limit early
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to load recent orders', err);
        // Optional: set empty on error
        this.orders = [];
      }
    });
  }

  private upsertOrder(newOrder: PublicOrderDTO): void {
    const index = this.orders.findIndex(o => o.orderId === newOrder.orderId);

    if (index !== -1) {
      this.orders[index] = newOrder;
    } else {
      this.orders.unshift(newOrder); // Newest at top
    }

    // Keep sorted and limited
    this.orders = this.orders
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  }

  ngOnDestroy(): void {
    this.pairSub?.unsubscribe();

    // Only unsubscribe WebSocket in browser
    if (isPlatformBrowser(this.platformId)) {
      this.wsService.unsubscribeFromRecentOrders();
    }
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  getSideClass(side: string): string {
    return side === 'BUY' ? 'buy-side' : 'sell-side';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      FILLED: 'status-filled',
      PARTIALLY_FILLED: 'status-partial',
      NEW: 'status-new',
      CANCELED: 'status-canceled',
      REJECTED: 'status-rejected',
      EXPIRED: 'status-expired'
    };
    return statusMap[status] || 'status-default';
  }

  getFillPercentage(order: PublicOrderDTO): number {
    const filled = Number(order.volumeFilled) || 0;
    const total = Number(order.volumeTotal) || 1;
    return Math.min(100, (filled / total) * 100);
  }
}
