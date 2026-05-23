export interface Account {
  id: number;
  accountId: string | null;
  cardNumber: string | null;
  email: string | null;
  provider: boolean;
  phoneNumber: string | null;
  accountName: string;
  gatewayCode: string | null;
  gatewayName: string | null;
  baseCurrency: string | null;
}

export interface TransactionManagerResponse {
  id: number;
  referenceId: string;
  amount: number;
  status: string;
  type: string;
  timestamp: string;
  receiptPaymentUrl: string | null;
  userId: number | null;
  managedById: number | null;
  createdAt: string | null;
  method: string;
  fromAccount: Account;
  toAccount: Account;
  currencyCode: string;
}