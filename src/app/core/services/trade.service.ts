import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment'
import { Page } from '../../model/page.model'; // Assuming you create a standard Page model
import { PaginatedTrades } from '../../model/paginated-trades.model'
import { TradeVolumeDTO } from '../../model/trade-volume.model'
import { Candlestick, ChartDataPoint } from '../../model/candle-stick-data.model'
import { MarketCandle, MarketCandleResponse, OutcomePosition } from '../../model/prediction-candle-stick-data.model'

@Injectable({
  providedIn: 'root'
})
export class TradeService {

  private http = inject(HttpClient);
  private readonly predictionCandleRequests = new Map<string, Observable<MarketCandleResponse>>();

  // LEGACY ENDPOINTS
  private BASE_ENDPOINT = '/api/v1/trade/market/trades';
  private TRADE_VOLUME_ENDPOINT = '/api/v1/trade/{currencyPairCode}/volume';

  // 🎯 NEW ENDPOINT FOR CHART DATA
  private CANDLESTICK_ENDPOINT = '/api/v1/charts/candles';
  private PREDICTION_CANDLESTICK_ENDPOINT = '/api/v1/charts/prediction-candles/{predictionMarketId}';

  constructor() {
  }

  // =========================================================
  // LEGACY METHODS (Kept intact)
  // =========================================================

  /**
   * Fetches a paginated list of recent trades for a given pair code.
   * @param pairCode The currency pair code (e.g., 'USDCUP').
   * @param page The requested page number (default: 0).
   * @param size The number of elements per page (default: 20).
   * @returns An Observable of the paginated trade data.
   */
  getRecentTradesPaged(
    pairCode: string,
    page: number = 0,
    size: number = 100
  ): Observable<PaginatedTrades> {
    const url = `${environment.baseApiUrl}${this.BASE_ENDPOINT}/${pairCode}/paged`;
    const params = {
      page: page.toString(),
      size: size.toString()
    };
    return this.http.get<PaginatedTrades>(url, { params });
  }

  /**
  * Fetches the trade volume for a specific currency pair.
  * * @param currencyPair The code for the currency pair (e.g., 'BTC-USD').
  * @returns An Observable of TradeVolumeDTO.
  */
  getTradeVolume(currencyPair: string): Observable<TradeVolumeDTO> {
    const path = this.TRADE_VOLUME_ENDPOINT.replace('{currencyPairCode}', currencyPair);
    const url = `${environment.baseApiUrl}${path}`;
    return this.http.get<TradeVolumeDTO>(url);
  }

  // =========================================================
  // 🎯 NEW CANDLESTICK METHODS
  // =========================================================

  /**
   * Fetches historical candlestick data for a given pair and time interval.
   * Corresponds to the Spring Boot endpoint: GET /api/v1/charts/candles/{pairCode}
   * * @param pairCode The trading pair (e.g., 'BTCUSD').
   * @param interval The candle interval (e.g., '5m', '1h').
   * @param limit The number of historical candles to fetch (default: 200).
   * @returns An Observable of an array of Candlestick objects.
   */
  getHistoricalCandlesticks(
    pairCode: string,
    interval: string,
    limit: number = 200
  ): Observable<Candlestick[]> {

    // 1. Construct the URL with the pairCode path variable
    const url = `${environment.baseApiUrl}${this.CANDLESTICK_ENDPOINT}/${pairCode}`;

    // 2. Add query parameters for interval and limit
    const params = {
      interval: interval,
      limit: limit.toString()
    };

    // 3. Make the HTTP GET request. The backend returns an array of CandlestickDTO,
    // which maps directly to the Candlestick[] TypeScript array.
    return this.http.get<Candlestick[]>(url, { params });
  }

  /**
   * Prepares the raw Candlestick data for consumption by the Chart.js financial plugin.
   * This is a utility method used by the component after fetching data.
   * * @param candles The array of Candlestick models from the backend.
   * @returns An array of ChartDataPoint objects suitable for ng2-charts.
   */
  mapToChartDataPoints(candles: Candlestick[]): ChartDataPoint[] {
    return candles.map(c => ({
      x: c.timestamp, // Unix timestamp in milliseconds
      o: c.open,
      h: c.high,
      l: c.low,
      c: c.close
    }));
  }

  /**
   * Fetches historical candles for one outcome in a prediction market.
   */
  getPredictionMarketCandlesticks(
    predictionMarketId: number,
    outcomePosition: OutcomePosition,
    interval: string,
    limit: number = 200
  ): Observable<MarketCandleResponse> {
    const cacheKey = `${predictionMarketId}:${outcomePosition}:${interval}:${limit}`;
    const cachedRequest = this.predictionCandleRequests.get(cacheKey);
    if (cachedRequest) {
      return cachedRequest;
    }

    const path = this.PREDICTION_CANDLESTICK_ENDPOINT.replace(
      '{predictionMarketId}',
      predictionMarketId.toString()
    );
    const url = `${environment.baseApiUrl}${path}`;
    const params = {
      outcomePosition,
      interval,
      limit: limit.toString()
    };

    const request = this.http
      .get<MarketCandleResponse>(url, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.predictionCandleRequests.set(cacheKey, request);

    return request;
  }

  /**
   * Prepares prediction-market candles for the Chart.js financial plugin.
   */
  mapMarketCandlesToChartDataPoints(candles: MarketCandle[]): ChartDataPoint[] {
    return candles.map(c => ({
      x: c.timestamp,
      o: c.open,
      h: c.high,
      l: c.low,
      c: c.close
    }));
  }

}
