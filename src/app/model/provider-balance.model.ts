export interface ProviderBalance {
  userId: number;
  accountName: string;
  paymentGatewayId: number;
  currencyCode: string;
  calculatedBalance: number;
  id: number;
}