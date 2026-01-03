import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Provider } from '../../model/provider.model'
import { Product } from '../../model/product.model'
import { User } from '../../model/user.model'

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private providerSource = new BehaviorSubject<Provider | null>(null);  
  currentProvider: Observable<Provider | null> = this.providerSource.asObservable();

  private productSource = new BehaviorSubject<Product | null>(null);  
  currentProduct: Observable<Product | null> = this.productSource.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  // The subject to hold and update the value
  private updateWalletRequiredSubject = new BehaviorSubject<boolean>(false);

  // The observable for components to subscribe to
  public updateWalletRequired$ = this.updateWalletRequiredSubject.asObservable();

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

  constructor() { }

  updateProvider(provider: Provider) {
    this.providerSource.next(provider);
  }

  updateProduct(product: Product) {
    this.productSource.next(product)
  }
 

  updateUser(user: User | null): void {
    this.currentUserSubject.next(user); // ← Use .next(), not .set()
  }

  // Optional: helper to get current value synchronously
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

}
