import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'
import { Page } from '../../model/page.model'; // Assuming you create a standard Page model

// Define the structure of a single trade DTO
export interface PublicTradeDto {
  pair: string;
  price: string;
  volume: string;
  timestamp: string;
  side: 'BUY' | 'SELL';
}

// Interface for the full paginated response (from Spring's Page<T>)
// This structure is often called 'Page' or 'PaginatedResponse'
export interface PaginatedTrades {
  content: PublicTradeDto[];
  pageable: any;          // Pagination request details
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;         // Current page number (0-indexed)
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class TradeService {

  private http = inject(HttpClient);

  // NOTE: It's better practice to allow the component to pass the pairCode dynamically.
  // We'll update the method signature to accept the parameters.

  private BASE_ENDPOINT = '/api/v1/trade/market/trades';

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

}
