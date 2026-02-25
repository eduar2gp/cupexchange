export interface TransactionManagerResponse {
  id: number;
  referenceId: string;
  amount: number;
  status: string;
  type: string;
  timestamp: string;
  receiptPaymentUrl: string | null;
}