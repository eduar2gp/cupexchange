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