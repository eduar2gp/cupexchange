export interface TransactionManagerResponse {
  id: number;
  referenceId: string;
  amount: number;
  status: string;
  type: string;
  timestamp: string;
  receiptPaymentUrl: string | null;
  userId: number;
  managedById: number;
  createdAt: string;
  method: string;
}