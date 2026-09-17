import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Provider } from '../../model/provider.model'
import { Product } from '../../model/product.model'
import { User } from '../../model/user.model'
import { TransactionRequest } from '../../model/transaction-request.model'
import { MerchantOrder } from '../../model/merchant-order-response.model'
import { HttpClient } from '@angular/common/http';
import { CashOrder } from '../../model/cash-order-response.model';
import { TransactionManagerResponse } from '../../model/transaction-manager.model';
import { VerificationStatusResponse } from '../../services/identity.service';
import { PredictionMarketResponse } from '../../model/prediction-market.model';

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

  private cashOrderSubject = new BehaviorSubject<CashOrder | null>(null);
  currentCashOrder: Observable<CashOrder | null> = this.cashOrderSubject.asObservable();

  private transactionSubject = new BehaviorSubject<TransactionManagerResponse | null>(null);
  currentTransaction: Observable<TransactionManagerResponse | null> = this.transactionSubject.asObservable();

  private verificationStatusSubject = new BehaviorSubject<VerificationStatusResponse | null>(null);
  verificationStatus$: Observable<VerificationStatusResponse | null> = this.verificationStatusSubject.asObservable();

  // The subject to hold and update the value
  private updateWalletRequiredSubject = new BehaviorSubject<boolean>(false);
  // The observable for components to subscribe to
  public updateWalletRequired$ = this.updateWalletRequiredSubject.asObservable();

  private readonly predictionMarketStatusSubject = new BehaviorSubject<PredictionMarketResponse | null>(null);
  predictionMarketStatus$: Observable<PredictionMarketResponse | null> = this.predictionMarketStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

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

  updateCashOrder(cashOrder: CashOrder | null): void{
    this.cashOrderSubject.next(cashOrder)
  }

  updateTransaction(transaction: TransactionManagerResponse | null): void{
    this.transactionSubject.next(transaction)
  }

  updateVerificationStatus(status: VerificationStatusResponse | null): void {
    this.verificationStatusSubject.next(status);
  }

  getVerificationStatus(): VerificationStatusResponse | null {
    return this.verificationStatusSubject.value;
  }

  getCashOrder(): CashOrder | null{
    return this.cashOrderSubject.value
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

  updatePredictionMarketStatus(market: PredictionMarketResponse | null): void {
    this.predictionMarketStatusSubject.next(market);
  }

  getPredictionMarketStatus(): PredictionMarketResponse | null {
    return this.predictionMarketStatusSubject.value;
  }

  getCurrentTransaction(): TransactionManagerResponse | null{
     return this.transactionSubject.value
  }

}