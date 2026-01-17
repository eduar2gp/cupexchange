export interface OrderPayload {
  providerId: number;
  customerId: string;
  status: 'pending';
  paid: false;
  totalPrice: number;
  orderProducts: {
    productId: number;
    quantity: number;
    priceAtPurchase: number;
  }[];
}
