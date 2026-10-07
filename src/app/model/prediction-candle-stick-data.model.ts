export type OutcomePosition = 'YES' | 'NO'; // Extend union if there are other positions like 'MAYBE'

export interface MarketCandle {
  predictionMarketId: number;
  outcomePosition: OutcomePosition;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
}

export type MarketCandleResponse = MarketCandle[];