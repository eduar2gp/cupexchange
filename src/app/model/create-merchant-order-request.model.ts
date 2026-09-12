import { OrderProductRequest } from './order-product-request.model';

export interface CreateOrderRequest {
  providerId: number;
  customerId: number;
  currencyCode: string;
  status: 'pending' | 'process' | 'completed' | 'canceled';
  paid: boolean;
  totalPrice: number;
  orderProducts: OrderProductRequest[];
}
