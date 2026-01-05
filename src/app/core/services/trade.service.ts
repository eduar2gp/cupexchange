import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'
import { Page } from '../../model/page.model'; // Assuming you create a standard Page model
import { PaginatedTrades } from '../../model/paginated-trades.model'
import { TradeVolumeDTO } from '../../model/trade-volume.model'

@Injectable({
  providedIn: 'root'
})
export class TradeService {

  private http = inject(HttpClient);

  private BASE_ENDPOINT = '/api/v1/trade/market/trades';
  private TRADE_VOLUME_ENDPOINT = '/api/v1/trade/{currencyPairCode}/volume';

  constructor() {
  }

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

    // 1. Construct the URL with path and query parameters
    const url = `${environment.baseApiUrl}${this.BASE_ENDPOINT}/${pairCode}/paged`;

    // 2. Add query parameters
    const params = {
      page: page.toString(),
      size: size.toString()
      // You could also add sort parameters here if needed: sort: 'timestamp,desc'
    };

    // 3. Make the HTTP GET request
    // We specify the expected return type is PaginatedTrades
    return this.http.get<PaginatedTrades>(url, { params });
  }

  /**
 * Fetches the trade volume for a specific currency pair.
 * * @param currencyPair The code for the currency pair (e.g., 'BTC-USD').
 * @returns An Observable of TradeVolumeDTO.
 */
  getTradeVolume(currencyPair: string): Observable<TradeVolumeDTO> {

    // 1. Construct the path by replacing the placeholder
    //    Use 'replace()' or string interpolation after constructing the base URL
    const path = this.TRADE_VOLUME_ENDPOINT.replace('{currencyPairCode}', currencyPair);

    // 2. Combine the environment base URL with the constructed path
    const url = `${environment.baseApiUrl}${path}`;

    // 3. Make the HTTP GET request
    return this.http.get<TradeVolumeDTO>(url);
  }

}
