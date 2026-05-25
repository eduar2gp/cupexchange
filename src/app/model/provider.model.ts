export interface CashAccount {
  currencyCode: string;
  withdrawalPercentageFee: number;
}

export interface Provider {
  id?: number;
  name: string;
  email: string;
  phone: string;
  userId?: number; // Kept from your original interface
  profileImageUrl?: string;
  address?: string;
  cashAccounts?: CashAccount[]; // Added to match the nested array
  cashProvider?: boolean;
}