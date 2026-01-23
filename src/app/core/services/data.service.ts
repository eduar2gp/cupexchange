import { Injectable, afterNextRender, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Provider } from '../../model/provider.model'
import { Product } from '../../model/product.model'
import { User } from '../../model/user.model'
import { TransactionRequest } from '../../model/transaction-request.model'
import { MerchantOrder } from '../../model/merchant-order-reponse.model'

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

  constructor() {
    afterNextRender(() => {     
      const saved = localStorage.getItem(this.STORAGE_KEY) === 'true';
      this.isEcommerceMode.next(saved);
    });
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
}
