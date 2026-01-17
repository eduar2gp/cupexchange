import { OrderProductRequest } from './order-product-request.model'
export interface CreateOrderRequest {
  providerId: number;
  customerId: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid: boolean;
  totalPrice: number;
  orderProducts: OrderProductRequest[];
}
