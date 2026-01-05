export interface PublicTradeDto {
  pair: string;
  price: string;
  volume: string;
  timestamp: string;
  side: 'BUY' | 'SELL';
}
