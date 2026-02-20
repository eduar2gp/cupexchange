export interface PaymentRequest {
  fromAccountId: string | number | null;
  toAccountId: string | number | null;
}

export interface PaymentResponse {
  id: number;
}