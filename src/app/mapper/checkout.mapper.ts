import { CartItem } from '../model/cart-item.model';
import { CreateOrderRequest } from '../model/create-merchant-order-request.model';

export function buildOrdersFromCart(
  items: CartItem[],
  customerId: string
): CreateOrderRequest[] {

  const grouped = new Map<number, CartItem[]>();

  items.forEach(item => {
    if (!grouped.has(item.providerId)) {
      grouped.set(item.providerId, []);
    }
    grouped.get(item.providerId)!.push(item);
  });

  const orders: CreateOrderRequest[] = [];

  grouped.forEach((items, providerId) => {
    const orderProducts = items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      priceAtPurchase: i.unitPrice
    }));

    const totalPrice = items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity, 0
    );

    orders.push({
      providerId,
      customerId,
      status: 'pending',
      paid: false,
      totalPrice,
      orderProducts
    });
  });

  return orders;
}
