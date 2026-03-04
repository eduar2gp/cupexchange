export interface PaymentRequest {
  fromAccountId: string | number | null;
  toAccountId: string | number | null;
  amount: number;
}

export interface PaymentResponse {
  id: number;
}