export interface CashOrder {
  orderId: number;
  status: string;
  createdAt: string; // ISO 8601 date string
  amount: number;
  currencyCode: string;
  user: UserReference;
  type: string;
}

export interface UserReference {
  id: number;
}