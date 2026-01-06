export interface Candlestick {
  /**
   * The trading pair code (e.g., "BTCUSD").
   */
  pair: string;

  /**
   * The start time of the candle period, in Unix milliseconds.
   * This is CRITICAL: it maps to the 'x' property in Chart.js.
   */
  timestamp: number;

  /**
   * The opening price of the candle.
   */
  open: number;

  /**
   * The highest price reached during the candle period.
   */
  high: number;

  /**
   * The lowest price reached during the candle period.
   */
  low: number;

  /**
   * The closing price of the candle (latest price for in-progress candles).
   */
  close: number;

  /**
   * The total volume traded during the candle period.
   */
  volume: number;

  /**
   * The time interval of the candle (e.g., "1m", "5m", "1h").
   */
  interval: string;
}

export interface ChartDataPoint {
  /**
   * X-axis value: Unix timestamp in milliseconds.
   */
  x: number;
  /**
   * Open price.
   */
  o: number;
  /**
   * High price.
   */
  h: number;
  /**
   * Low price.
   */
  l: number;
  /**
   * Close price.
   */
  c: number;
}
