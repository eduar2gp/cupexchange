import { OrderProductRequest } from './order-product-request.model'
export interface CreateOrderRequest {
  providerId: number;
  customerId: string;
  status: 'pending' | 'paid' | 'cancelled';
  paid: boolean;
  totalPrice: number;
  orderProducts: OrderProductRequest[];
}
