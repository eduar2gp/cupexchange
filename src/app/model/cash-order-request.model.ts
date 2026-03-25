export interface CashOrderRequestDTO {
  userId: number;
  providerId: number;
  amount: number;
  currencyCode: string;
  type: string;
}