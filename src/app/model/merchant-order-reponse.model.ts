import { CreateOrderRequest } from './create-merchant-order-request.model';
export interface MerchantOrder extends CreateOrderRequest {
  merchantOrderId: number;
}
