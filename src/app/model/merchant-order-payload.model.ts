export interface OrderPayload {
  providerId: number;
  customerId: number;
  status: 'pending';
  paid: false;
  totalPrice: number;
  orderProducts: {
    productId: number;
    quantity: number;
    priceAtPurchase: number;
  }[];
}
