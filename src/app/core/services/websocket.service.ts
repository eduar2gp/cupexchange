import { Injectable, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface PublicTradeDto {
  pair: string;
  price: string;
  volume: string;
  timestamp: string;
  side: 'BUY' | 'SELL';
}

export interface PublicOrderDTO {
  orderId: number;
  pair: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: string | null;
  volumeTotal: string;
  volumeFilled: string;
  volumeRemaining: string;
  status: 'ACTIVE' | 'PARTLY_FILLED' | 'FILLED' | 'CANCELED';
  timestamp: number;
}

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

  // Public trades (all recent trades for current pair)
  private publicTradesSubject = new BehaviorSubject<PublicTradeDto[]>([]);
  public publicTrades$ = this.publicTradesSubject.asObservable();

  // Latest single trade
  private latestTradeSubject = new BehaviorSubject<PublicTradeDto | null>(null);
  public latestTrade$ = this.latestTradeSubject.asObservable();

  // Private (user-specific) trades
  private privateTradesSubject = new BehaviorSubject<PrivateTrade[]>([]);
  public privateTrades$ = this.privateTradesSubject.asObservable();

  // Recent orders (public order updates)
  private recentOrdersSubject = new Subject<PublicOrderDTO>();
  public recentOrders$ = this.recentOrdersSubject.asObservable();

  // Subscription tracking
  private publicTradesSubscription: StompSubscription | null = null;
  private recentOrdersSubscription: StompSubscription | null = null;
  private privateTradesSubscription: StompSubscription | null = null;

  private currentPair = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object ) {
    if(isPlatformBrowser(this.platformId)){
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

  /** Subscribe to public trades for a specific pair */
  public subscribeToPublicTrades(pair: string): void {
    const normalizedPair = this.normalizePair(pair);
    if (normalizedPair === this.currentPair) return;

    // Clean up previous subscription
    this.unsubscribeFromPublicTrades();
    this.currentPair = normalizedPair;

    if (!this.client.connected) {
      // Will be handled in onConnect
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

  // Unsubscribe methods
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

  // Message handlers
  private handlePublicTrade(message: IMessage): void {
    try {
      const trade: PublicTradeDto = JSON.parse(message.body);
      const current = this.publicTradesSubject.value;
      const updated = [trade, ...current].slice(0, 100); // Keep last 100
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
