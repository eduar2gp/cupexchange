import { Injectable, afterNextRender, signal, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Provider } from '../../model/provider.model'
import { Product } from '../../model/product.model'
import { User } from '../../model/user.model'
import { TransactionRequest } from '../../model/transaction-request.model'
import { MerchantOrder } from '../../model/merchant-order-reponse.model'
import { isPlatformBrowser } from '@angular/common';
import { build, ApiEndpoints } from '../api/endpoints';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private transactionRequestSource = new BehaviorSubject<TransactionRequest | null>(null);
  currentTransactionRequest: Observable<TransactionRequest | null> = this.transactionRequestSource.asObservable();

  private providerSource = new BehaviorSubject<Provider | null>(null);
  currentProvider: Observable<Provider | null> = this.providerSource.asObservable();

  private productSource = new BehaviorSubject<Product | null>(null);
  currentProduct: Observable<Product | null> = this.productSource.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  private merchantOrderSubject = new BehaviorSubject<MerchantOrder | null>(null);
  currentMerchantOrder: Observable<MerchantOrder | null> = this.merchantOrderSubject.asObservable();

  // The subject to hold and update the value
  private updateWalletRequiredSubject = new BehaviorSubject<boolean>(false);
  // The observable for components to subscribe to
  public updateWalletRequired$ = this.updateWalletRequiredSubject.asObservable();

  readonly STORAGE_KEY = 'IS_ECOMMERCE_MODE';
  private isEcommerceMode = new BehaviorSubject<boolean>(false);
  public isEcommerce$ = this.isEcommerceMode.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    // Standard way to handle browser-only logic in a service
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.STORAGE_KEY) === 'true';
      this.isEcommerceMode.next(saved);
    }
  }

  // Method to set the value to true
  public triggerWalletUpdate(): void {
    this.updateWalletRequiredSubject.next(true);
  }

  // Method to set the value to false
  public walletUpdateCompleted(): void {
    this.updateWalletRequiredSubject.next(false);
  }

  public isUpdateRequired(): boolean {
    return this.updateWalletRequiredSubject.value;
  }

  updateProvider(provider: Provider) {
    this.providerSource.next(provider);
  }

  updateProduct(product: Product) {
    this.productSource.next(product)
  }

  updateUser(user: User | null): void {
    this.currentUserSubject.next(user); // ← Use .next(), not .set()
  }

  updateMerchantOrder(merchantOrder: MerchantOrder | null): void {
    this.merchantOrderSubject.next(merchantOrder); 
  }

  getMerchantOrder(): MerchantOrder | null {
    return this.merchantOrderSubject.value;
  }

  // Optional: helper to get current value synchronously
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  updateTransactionRequest(transactionRequest: TransactionRequest) {
    this.transactionRequestSource.next(transactionRequest);
  }

  getCurrentTransactionRequest(): TransactionRequest | null {
    return this.transactionRequestSource.value;
  }

  get currentMode(): boolean {
    return this.isEcommerceMode.value;
  }

  setEcommerceMode(enabled: boolean) {
    this.isEcommerceMode.next(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, String(enabled));
    }
  }

  // Initial count is 0
  public unreadNotificationsSubject = new BehaviorSubject<number>(0);
  
  // Public observable for the UI
  unreadNotificationsCount$ = this.unreadNotificationsSubject.asObservable();

  // Method to increment the count (e.g., when a message arrives)
  incrementNotifications() {
    const currentCount = this.unreadNotificationsSubject.value;
    this.unreadNotificationsSubject.next(currentCount + 1);
  }

  // Method to reset the count (e.g., when the user visits the notifications page)
  resetNotifications() {
    this.unreadNotificationsSubject.next(0);
  }

  // Method to set a specific count (e.g., after an API call)
  setNotifications(count: number) {
    this.unreadNotificationsSubject.next(count);
  }

  /**
   * Fetches the unread count and updates the BehaviorSubject
   */
  getUnseenNotificationCount(userId: number | string): void {
    const url = build(ApiEndpoints.notification.GET_UNSEEN_COUNT, { userId });
    this.http.get<number>(url).subscribe({
      next: (count) => {
        // 4. Update the subject so all subscribers see the new value
        this.unreadNotificationsSubject.next(count);
      },
      error: (err) => console.error('Error fetching notification count:', err)
    });
  }
}