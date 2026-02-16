export interface TransactionRequest {
  currencyCode: string | undefined;
  type: string;
  amount?: number;
  referenceId?: number;
}
