export type OrderSide = 'BUY' | 'SELL';
export type OutcomePosition = 'YES' | 'NO';
export type OrderStatus = 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';

export interface PredictionOrderResponse {
  orderId: number;
  appUserId: number;
  walletId: number;
  marketId: number;
  question: string;
  eventTitle: string;
  categoryName: string;
  currencyCode: string;
  side: OrderSide;
  outcomePosition: OutcomePosition;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: string; // ISO 8601 string representation of OffsetDateTime
}

// Type alias for array responses
export type PredictionOrderResponseList = PredictionOrderResponse[];