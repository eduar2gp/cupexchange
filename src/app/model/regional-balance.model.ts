export interface BalanceSummary {
  currencyCode: string;
  totalBalance: number;
  totalAccounts: number;
}

export interface MunicipalityBalance {
  municipalityId: number;
  municipalityName: string;
  balances: BalanceSummary[];
}

export interface ProvinceBalance {
  provinceId: number;
  provinceName: string;
  municipalities: MunicipalityBalance[];
}

// Response type for the API endpoint
export type RegionalBalanceResponse = ProvinceBalance[];