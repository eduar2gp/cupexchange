export interface Account {
  id: number;
  accountId: string | number | null;
  paymentGatewayId: string | null;      // Updated to allow null
  gatewayName: string | null;           // Updated to allow null
  baseCurrency: string;
  userName: string;
  accountName: string;
  email: string | null;
  phone: string | null;
  cardNumber: string;            // Updated to allow null
  provider: boolean;
  
  // --- New Fields Added Below ---
  accountType: string; 
  withdrawalPercentageFee: number;
}