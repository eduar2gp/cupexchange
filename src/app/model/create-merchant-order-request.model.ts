import { OrderProductResponse } from './order-product-response.model'
export interface CreateOrderRequest {
  providerId: number;
  customerId: number;
  status: 'pending' | 'process' | 'completed' | 'canceled';
  paid: boolean;
  totalPrice: number;
  orderProducts: OrderProductResponse[];
}
