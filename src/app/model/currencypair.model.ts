export interface Pair {
  pairId: number;
  pairCode: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  minVolume?: number;
  tickSize?: number;
  baseScale?: number;
  quoteScale?: number;
  active?: boolean;
}
