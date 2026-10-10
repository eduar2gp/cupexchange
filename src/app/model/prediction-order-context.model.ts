import { PredictionMarketResponse } from './prediction-market.model';
import { PredictionMarketOdds } from './prediction-market-odds.model';
import { OutcomePosition } from './prediction-order-request.model';

export interface PredictionOrderContext {
  market: PredictionMarketResponse;
  odds: PredictionMarketOdds | null;
  selectedOutcome: OutcomePosition | null;
}
