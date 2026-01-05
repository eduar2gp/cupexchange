import { PublicTradeDto } from '../model/public-trade-dto.model'
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
