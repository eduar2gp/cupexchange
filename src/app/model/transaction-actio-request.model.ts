export interface TransactionActionRequest {
  transactionId: number;
  action: 'CONFIRM_DEPOSIT' | 'REJECT_DEPOSIT' | 'CONFIRM_WITHDRAWAL' | 'REJECT_WITHDRAWAL';
}