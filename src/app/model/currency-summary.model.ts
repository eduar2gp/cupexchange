export interface CurrencySummary {
  currencyCode: string;
  totalWalletBalance: number;
  totalProviderBalance: number;
  providerAccountCount: number;
  lastRefreshedAt: string | null;
}

export type CurrencySummaryResponse = CurrencySummary[];
