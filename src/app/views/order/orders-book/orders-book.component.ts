
import { Component, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy, Inject, signal, WritableSignal, computed, Signal, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { WebSocketService } from '../../../core/services/websocket.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';
import { OrdersService } from '../../../core/services/orders.service';
import { Subscription } from 'rxjs';
import { TradingPair } from '../../../model/trading_pair';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PublicOrderDTO } from '../../../model/public_order_dto'

export type LayoutMode = 'stacked' | 'side-by-side' | 'mixed';

@Component({
  selector: 'app-order-book',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    DecimalPipe,
  ],
  templateUrl: './orders-book.component.html',
  styleUrl: './orders-book.component.scss', // Changed to .scss for CSS variables
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush with Signals for performance
})
export class OrderBookComponent implements OnInit, OnDestroy {
  // 1. STATE MANAGEMENT: Use a WritableSignal for the source data
  private ordersSignal: WritableSignal<PublicOrderDTO[]> = signal([]);

  @Input() layoutMode: LayoutMode = 'side-by-side';
  @Input() MAX_ORDERS_ITEMS: number = 100;

  // 2. COMPUTED STATE: Create reactive, filtered lists (sorted by timestamp)
  public buyOrders: Signal<PublicOrderDTO[]> = computed(() =>
    this.ordersSignal()
      .filter(o => o.side === 'BUY')
      .filter(o => o.type !== 'MARKET')
      // No need to sort here, sorting will be done by price for a real Order Book
      // but keeping your existing timestamp sort for recent trades list:
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50) // Adjust limit for half the screen
  );

  public sellOrders: Signal<PublicOrderDTO[]> = computed(() =>
    this.ordersSignal()
      .filter(o => o.side === 'SELL')
      .filter(o => o.type !== 'MARKET')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50) // Adjust limit for half the screen
  );

  public currentPairSignal: WritableSignal<TradingPair | null> = signal(null);

  public priceFormat: Signal<string> = computed(() => {
    // Read the value from the signal using the getter function ()
    const pair = this.currentPairSignal();
    const viewValue = pair?.viewValue;

    if (!viewValue) {
      return '1.2-2';
    }

    if (viewValue === 'CUP') {
      return '1.2-4';
    } else if (viewValue === 'USD') {
      return '1.0-0';
    }

    return '1.2-2';
  });

  private pairSub?: Subscription;

  constructor(
    private wsService: WebSocketService,
    private pairSelectionService: PairSelectionService,
    private orderService: OrdersService,
    private ngZone: NgZone,
    // ChangeDetectorRef is no longer strictly required for state updates, but keeping for Zone management
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Inject the signal helper (optional, but a good practice to indicate usage)
  }

  ngOnInit(): void {
    const initialPair = this.pairSelectionService.getCurrentPair();
    const pairCode = initialPair?.value || 'USDCUP';
    this.currentPairSignal.set(initialPair); // Initialize currentPair

    this.loadInitialOrders(pairCode);

    if (isPlatformBrowser(this.platformId)) {
      this.wsService.subscribeToRecentOrders(pairCode);

      this.pairSub = this.pairSelectionService.selectedPair$.subscribe(pair => {
        this.currentPairSignal.set(pair);
        if (pair) {
          this.loadInitialOrders(pair.value);
          // Note: The websocket service should handle unsubscribing the OLD pair 
          // before subscribing to the NEW one, but we call the high-level API here.
          this.wsService.subscribeToRecentOrders(pair.value);
        }
      });

      // Listen to real-time order updates from WebSocket
      this.wsService.recentOrders$.subscribe((order: PublicOrderDTO) => {
        // Run outside Angular's zone for performance, but need to update signal
        // We use NgZone.run to ensure the signal update triggers a minimal change detection
        // if the component is outside the main zone.
        this.ngZone.run(() => {
          this.upsertOrder(order);
          // With Signals, no need for this.cdr.detectChanges()
        });
      });
    }
  }

  private loadInitialOrders(pair: string): void {
    this.orderService.findTopNByPairCode(pair, this.MAX_ORDERS_ITEMS).subscribe({
      next: (initialOrders: PublicOrderDTO[]) => {
        this.ngZone.run(() => {
          // Use set() to replace the entire array and trigger signal update
          this.ordersSignal.set(initialOrders);
        });
      },
      error: (err) => {
        console.error('Failed to load recent orders', err);
        this.ordersSignal.set([]); // Set empty on error
      }
    });
  }

  private upsertOrder(newOrder: PublicOrderDTO): void {
    // Update the signal immutably
    this.ordersSignal.update(orders => {
      const index = this.ordersSignal().findIndex(o => o.orderId === newOrder.orderId);
      if (index !== -1) {
        // Update existing order immutably
        return orders.map((order, i) => (i === index ? newOrder : order));
      } else {
        // Insert new order (newest at top)
        return [newOrder, ...orders];
      }

      // Sorting and slicing is now handled by the computed signals (buyOrders/sellOrders)
      // to avoid re-sorting the main list on every update.
    });
  }

  ngOnDestroy(): void {
    this.pairSub?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      this.wsService.unsubscribeFromRecentOrders();
    }
  }

  // --- Utility Methods (Kept for template usage) ---

  // Note: formatTime, getSideClass, getStatusBadgeClass, getFillPercentage 
  // are no longer needed in the template based on the new design (Price/Total only),
  // but they are kept here in case you re-introduce them later.

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
  }

  get layoutClasses() {
    return {
      'stacked': this.layoutMode === 'stacked',
      'side-by-side': this.layoutMode === 'side-by-side',
      // You can add more complex conditions here if needed
    };
  }
}
