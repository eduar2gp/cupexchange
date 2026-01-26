export interface MerchantOrder {
  merchantOrderId: number;
  status: 'pending' | 'process' | 'completed' | 'canceled';
}
