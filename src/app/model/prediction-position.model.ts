export type OutcomePosition = 'YES' | 'NO'; // Add other enum values if applicable

export interface PredictionPosition {
  id: number;
  appUserId: number;
  walletId: number;
  predictionMarketId: number;
  outcomePosition: OutcomePosition;
  quantity: number;
  totalCost: number;
  avgPrice: number;
  realizedPnl: number;
  currencyCode: string;
  createdAt: string; // ISO 8601 Date String
  updatedAt: string; // ISO 8601 Date String
}