export type OrderSide = 'BUY' | 'SELL';
export type OutcomePosition = 'YES' | 'NO';

export interface PredictionOrderRequest {
  appUserId: number;
  walletId: number;
  marketId: number;
  side: OrderSide;
  outcomePosition: OutcomePosition;
  price: number;
  quantity: number;
}