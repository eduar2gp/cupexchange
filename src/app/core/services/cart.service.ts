import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../model/cart-item.model';
import { map } from 'rxjs/operators';

const CART_STORAGE_KEY = 'shopping_cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private isBrowser: boolean;

  private cartItemsSubject: BehaviorSubject<CartItem[]>;
  cartItems$;
  cartCount$;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    const initialItems = this.isBrowser ? this.loadFromStorage() : [];
    this.cartItemsSubject = new BehaviorSubject<CartItem[]>(initialItems);
    this.cartItems$ = this.cartItemsSubject.asObservable();

    this.cartCount$ = this.cartItems$.pipe(
      map(items => items.reduce((sum, i) => sum + i.quantity, 0))
    );
  }

  // ---- Public API ----

  addToCart(item: CartItem): void {
    const items = [...this.cartItemsSubject.value];
    const existing = items.find(i => i.productId === item.productId);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }

    this.updateCart(items);
  }

  removeFromCart(productId: number): void {
    const items = this.cartItemsSubject.value.filter(i => i.productId !== productId);
    this.updateCart(items);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  getItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // ---- Internal Helpers ----

  private updateCart(items: CartItem[]): void {
    this.cartItemsSubject.next(items);

    if (this.isBrowser) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }

  private loadFromStorage(): CartItem[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) as CartItem[] : [];
  }
}
