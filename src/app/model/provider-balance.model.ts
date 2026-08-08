export interface ProviderBalance {
  userId: number;
  accountName: string;
  providerName: string;
  paymentGatewayId: number;
  currencyCode: string;
  calculatedBalance: number;
  id: number;
}