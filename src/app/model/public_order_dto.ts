export interface PublicOrderDTO {
  orderId: number;
  pair: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: string | number | null;
  volumeTotal: string;
  volumeFilled: string;
  volumeRemaining: string;
  status: 'ACTIVE' | 'PARTLY_FILLED' | 'FILLED' | 'CANCELED';
  timestamp: number;
}
