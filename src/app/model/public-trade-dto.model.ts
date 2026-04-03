export interface PublicTradeDto {
  id: number,
  pair: string;
  price: string;
  volume: string;
  timestamp: string;
  side: 'BUY' | 'SELL';
}
