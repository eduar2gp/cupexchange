export interface Account {
  id: number;
  accountId: string | number | null;
  paymentGatewayId: string;
  gatewayName: string;
  baseCurrency: string;
  userName: string;
  accountName: string;
  email: string | null;
  phone: string | null;
  cardNumber: string;
  provider: boolean;
}