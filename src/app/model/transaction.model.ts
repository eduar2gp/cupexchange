export type TransactionType =
  | 'FEE_COLLECTION'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'REFUND'
  | 'REWARD';

export interface Transaction {
  id: number;
  amount: number;
  currency: string;
  type: TransactionType;
  createdAt: string;  
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}
