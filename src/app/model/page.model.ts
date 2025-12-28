export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    sort?: any;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first?: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}
