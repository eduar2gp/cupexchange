export interface Account {
  id: number;
  accountId: string | number | null;
  gatewayName: string;
  baseCurrency: string;
  userName: string;
  email: string | null;
  phone: string | null;
  cardNumber: string;
}