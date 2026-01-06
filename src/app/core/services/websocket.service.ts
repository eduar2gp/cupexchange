import { Injectable, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

// 🎯 ASSUMED IMPORTS: Please verify these paths in your project
import { PublicOrderDTO } from '../../model/public_order_dto';
import { PublicTradeDto } from '../../model/public-trade-dto.model';
import { Candlestick } from '../../model/candle-stick-data.model';

export interface PrivateTrade {
  tradeId: number;
  pair: string;
  executedPrice: string;
  executedVolume: string;
  executionTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private client!: Client;

  // =========================================================
  // LEGACY OBSERVABLES
  // =========================================================

  private publicTradesSubject = new BehaviorSubject<PublicTradeDto[]>([]);
  public publicTrades$: Observable<PublicTradeDto[]> = this.publicTradesSubject.asObservable();

  private latestTradeSubject = new BehaviorSubject<PublicTradeDto | null>(null);
  public latestTrade$: Observable<PublicTradeDto | null> = this.latestTradeSubject.asObservable();

  private privateTradesSubject = new BehaviorSubject<PrivateTrade[]>([]);
  public privateTrades$: Observable<PrivateTrade[]> = this.privateTradesSubject.asObservable();

  private recentOrdersSubject = new Subject<PublicOrderDTO>();
  public recentOrders$: Observable<PublicOrderDTO> = this.recentOrdersSubject.asObservable();

  // =========================================================
  // 🎯 NEW CANDLESTICK OBSERVABLE
  // =========================================================

  private candleSubject = new Subject<Candlestick>();
  public candleUpdates$: Observable<Candlestick> = this.candleSubject.asObservable();

  // =========================================================
  // SUBSCRIPTION TRACKING
  // =========================================================

  private publicTradesSubscription: StompSubscription | null = null;
  private recentOrdersSubscription: StompSubscription | null = null;
  private privateTradesSubscription: StompSubscription | null = null;
  private candleSubscription: StompSubscription | null = null; // 🎯 New tracker

  private currentPair = '';
  private currentInterval = ''; // 🎯 New state tracker for the candle interval

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.client = this.createClient();
      this.client.activate();
    }
  }

  private createClient(): Client {
    const socketUrl = environment.baseApiUrl + '/ws/stomp';
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str: string) => console.log('[STOMP]', str),
    });

    client.onConnect = () => {
      console.log('WebSocket connected');
      // Resubscribe to current pair if set
      if (this.currentPair) {
        this.subscribeToPublicTrades(this.currentPair);
        this.subscribeToRecentOrders(this.currentPair);

        // 🎯 NEW: Resubscribe to candles on reconnect
        if (this.currentInterval) {
          this.subscribeToCandles(this.currentPair, this.currentInterval);
        }
      }
      // Private trades (user-specific) can be subscribed separately if needed
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message'], frame.body);
    };

    client.onWebSocketClose = () => {
      console.warn('WebSocket closed – reconnecting...');
    };

    return client;
  }

  // =========================================================
  // 🎯 NEW CANDLESTICK SUBSCRIPTION
  // =========================================================

  /**
   * Subscribes to real-time candlestick updates for a specific pair and interval.
   * Topic: /topic/candles/{pair}/{interval}
   */
  public subscribeToCandles(pair: string, interval: string): void {
    const normalizedPair = this.normalizePair(pair);
    const normalizedInterval = interval.toLowerCase();

    // Prevent redundant subscription if pair and interval haven't changed
    if (normalizedPair === this.currentPair && normalizedInterval === this.currentInterval && this.client.connected) {
      return;
    }

    // Clean up previous subscription
    this.unsubscribeFromCandles();

    this.currentPair = normalizedPair;
    this.currentInterval = normalizedInterval;

    if (!this.client.connected) {
      // Subscription will be handled in onConnect
      return;
    }

    const topic = `/topic/candles/${normalizedPair}/${normalizedInterval}`;

    this.candleSubscription = this.client.subscribe(
      topic,
      (message: IMessage) => this.handleCandleUpdate(message)
    );

    console.log(`Subscribed to candlestick updates: ${topic}`);
  }

  /** Unsubscribe from candlestick updates */
  public unsubscribeFromCandles(): void {
    if (this.candleSubscription) {
      this.candleSubscription.unsubscribe();
      this.candleSubscription = null;
    }
    this.currentInterval = ''; // Clear interval state
  }

  // =========================================================
  // LEGACY SUBSCRIPTION METHODS
  // =========================================================

  /** Subscribe to public trades for a specific pair */
  public subscribeToPublicTrades(pair: string): void {
    const normalizedPair = this.normalizePair(pair);
    if (normalizedPair === this.currentPair && this.publicTradesSubscription) return; // Prevent redundant subscription

    this.unsubscribeFromPublicTrades();
    this.currentPair = normalizedPair;

    if (!this.client.connected) {
      return;
    }

    this.publicTradesSubscription = this.client.subscribe(
      `/topic/public-trades/${normalizedPair}`,
      (message: IMessage) => this.handlePublicTrade(message)
    );

    console.log(`Subscribed to public trades: ${normalizedPair}`);
  }

  /** Subscribe to recent order updates for a pair */
  public subscribeToRecentOrders(pair: string): void {
    const normalizedPair = this.normalizePair(pair);

    this.unsubscribeFromRecentOrders();

    if (!this.client.connected) {
      this.currentPair = normalizedPair; // Store for reconnection
      return;
    }

    this.recentOrdersSubscription = this.client.subscribe(
      `/topic/recent-orders/${normalizedPair}`,
      (message: IMessage) => {
        try {
          const order: PublicOrderDTO = JSON.parse(message.body);
          this.recentOrdersSubject.next(order);
        } catch (error) {
          console.error('Failed to parse recent order:', error);
        }
      }
    );

    console.log(`Subscribed to recent orders: ${normalizedPair}`);
  }

  /** Optional: Subscribe to user's private trades (e.g., after login) */
  public subscribeToPrivateTrades(userId: string): void {
    this.unsubscribeFromPrivateTrades();

    if (!this.client.connected) return;

    this.privateTradesSubscription = this.client.subscribe(
      `/user/${userId}/queue/trades`,
      (message: IMessage) => this.handlePrivateTrade(message)
    );
  }

  // =========================================================
  // UNSUBSCRIBE METHODS
  // =========================================================

  public unsubscribeFromPublicTrades(): void {
    if (this.publicTradesSubscription) {
      this.publicTradesSubscription.unsubscribe();
      this.publicTradesSubscription = null;
    }
  }

  public unsubscribeFromRecentOrders(): void {
    if (this.recentOrdersSubscription) {
      this.recentOrdersSubscription.unsubscribe();
      this.recentOrdersSubscription = null;
    }
  }

  public unsubscribeFromPrivateTrades(): void {
    if (this.privateTradesSubscription) {
      this.privateTradesSubscription.unsubscribe();
      this.privateTradesSubscription = null;
    }
  }

  // =========================================================
  // MESSAGE HANDLERS
  // =========================================================

  /** 🎯 NEW: Handles incoming IMessage and emits a Candlestick object */
  private handleCandleUpdate(message: IMessage): void {
    try {
      const candle: Candlestick = JSON.parse(message.body);
      this.candleSubject.next(candle);
    } catch (error) {
      console.error('Failed to parse candlestick update:', error);
    }
  }

  private handlePublicTrade(message: IMessage): void {
    try {
      const trade: PublicTradeDto = JSON.parse(message.body);
      const current = this.publicTradesSubject.value;
      const updated = [trade, ...current].slice(0, 100);
      this.publicTradesSubject.next(updated);
      this.latestTradeSubject.next(trade);
    } catch (error) {
      console.error('Failed to parse public trade:', error);
    }
  }

  private handlePrivateTrade(message: IMessage): void {
    try {
      const trade: PrivateTrade = JSON.parse(message.body);
      const current = this.privateTradesSubject.value;
      const updated = [trade, ...current].slice(0, 100);
      this.privateTradesSubject.next(updated);
    } catch (error) {
      console.error('Failed to parse private trade:', error);
    }
  }

  private normalizePair(pair: string): string {
    return pair.replace('/', '-').toUpperCase();
  }

  /** Manually disconnect (e.g., on logout) */
  public disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
      console.log('WebSocket disconnected');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
