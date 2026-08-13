export interface MonthlyStatement {
  id: number;
  accountId: number;
  statementPeriodStart: string; // ISO Date string (YYYY-MM-DD)
  statementPeriodEnd: string;   // ISO Date string (YYYY-MM-DD)
  balanceBefore: number;
  balanceAfter: number;
  generatedAt: string;          // ISO DateTime string
  pdfUrl: string;
}

export interface MonthlyStatementOptions {
    daysBack?: number;
    startDate?: Date | string; // ISO format: YYYY-MM-DD
    endDate?: Date | string;   // ISO format: YYYY-MM-DD
}

export interface ReportResult {
    rows: number;
    path: string;
}