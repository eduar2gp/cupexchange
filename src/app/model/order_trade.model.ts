export interface OrderTrade {
  username: string;
  pairCode: string;
  side: 'BUY' | 'SELL';
  type: string;
  price: number;
  volume: number;
}
