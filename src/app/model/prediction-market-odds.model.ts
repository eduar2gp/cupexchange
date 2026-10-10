export interface PredictionMarketOdds {
  marketId: number;
  headerOdds: number;
  headerOddsPercent: number;
  buyYesPrice: number | null;
  buyNoPrice: number | null;
  bestYesBid: number | null;
  bestNoBid: number | null;
  spread: number;
  reliesOnLastTrade: boolean;
  lastTradedPrice?: number;
}