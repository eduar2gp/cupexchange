import { ChartDataPoint } from '../model/candle-stick-data.model';

export interface ChartMarketInput {
  id: number;
  label: string; // e.g., market.outcomeTitle or market.question
}

export interface ChartSeries {
  label: string;
  color: string;
  points: ChartDataPoint[];
}