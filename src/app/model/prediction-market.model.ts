export type OutcomeType = 'YES' | 'NO';
export type MarketStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | 'RESOLVED';

export interface PredictionMarketResponse {
  id: number;
  eventId: number;
  eventTitle: string;
  categoryId: number;
  categoryName: string;
  question: string;
  outcomeType: OutcomeType;
  currencyCode: string;
  status: MarketStatus;
  winningOutcome: boolean | null;
}

// API response for a market collection.
export type PredictionMarketList = PredictionMarketResponse[];