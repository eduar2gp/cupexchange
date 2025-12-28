export interface Wallet {
  walletId?: string;
  currencyCode?: string;
  availableBalance: number;
  lockedBalance: number;
  balance: number;
}
