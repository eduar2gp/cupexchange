import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../core/services/cart.service';
import { MerchantOrdersService } from '../../core/services/merchant-order.service';
import { CartItem } from '../../model/cart-item.model';
import { CreateOrderRequest } from '../../model/create-merchant-order-request.model';
import { TranslateModule } from '@ngx-translate/core';
import { OrderPayload } from '../../model/merchant-order-payload.model'
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    MatCardModule
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  cartItems$ = this.cartService.cartItems$;
  isSubmitting = false;
  errorMessage = '';

  groupedOrders: {
    providerId: number;
    items: CartItem[];
    total: number;
  }[] = [];

  constructor(
    private orderService: MerchantOrdersService
  ) { }

  ngOnInit() {
    this.buildOrders();
  }

  private buildOrders() {
    const items = this.cartService.getSnapshot();

    const map = new Map<number, CartItem[]>();

    items.forEach(item => {
      if (!map.has(item.providerId)) {
        map.set(item.providerId, []);
      }
      map.get(item.providerId)!.push(item);
    });

    this.groupedOrders = Array.from(map.entries()).map(([providerId, items]) => ({
      providerId,
      items,
      total: items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    }));
  }

  sendOrder(orderGroup: any) {

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.userId) {
      console.error('No logged-in user, cannot send order');
      return;
    }

    const payload: OrderPayload = {
      providerId: orderGroup.providerId,
      customerId: currentUser.userId,
      status: 'pending',
      paid: false,
      totalPrice: orderGroup.total,
      orderProducts: orderGroup.items.map((i: CartItem) => ({
        productId: i.productId,
        quantity: i.quantity,
        priceAtPurchase: i.unitPrice
      }))
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        // remove only these items from cart
        this.cartService.removeByProvider(orderGroup.providerId);
        // rebuild view
        this.buildOrders();
      },
      error: err => console.error('Order failed', err)
    });
  }
}
