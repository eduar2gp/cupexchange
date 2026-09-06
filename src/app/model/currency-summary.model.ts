export interface CurrencySummary {
  currencyCode: string;
  totalWalletBalance: number;
  completedDeposits: number;
  completedWithdrawals: number;
  completedFeeCollections: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingFeeCollections: number;
  providerAccountCount: number;
  lastRefreshedAt: string | null;
}

export type CurrencySummaryResponse = CurrencySummary[];
