import { build, ApiEndpoints } from '../../../app/core/api/endpoints';
import { Injectable } from '@angular/core';
import { Page } from '../../model/page.model';
import { MonthlyStatement, MonthlyStatementOptions, ReportResult } from '../../model/monthly-statement.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportService {

    constructor(private http: HttpClient) { }

    getMonthlyStatements(
        accountId: number | string,
        page: number = 0,
        size: number = 10,
        sort: string = 'generatedAt,desc'
    ): Observable<Page<MonthlyStatement>> {
        const fullUrl = build(ApiEndpoints.reports.GET_ACCOUNT_REPORTS, { accountId: accountId.toString() });
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', sort);

        return this.http.get<Page<MonthlyStatement>>(fullUrl, { params });
    }


    postGenerateMonthlyStatement(
        accountId: number | string,
        options?: MonthlyStatementOptions
    ): Observable<ReportResult> {
        const fullUrl = build(ApiEndpoints.reports.POST_GENERATE_ACCOUNT_REPORT, { accountId: accountId.toString() });

        let params = new HttpParams();

        if (options?.daysBack !== undefined) {
            params = params.set('daysBack', options.daysBack.toString());
        } else {
            if (options?.startDate) {
                params = params.set('startDate', this.formatToIsoDate(options.startDate));
            }
            if (options?.endDate) {
                params = params.set('endDate', this.formatToIsoDate(options.endDate));
            }
        }

        // Updated return type to match controller's ResponseEntity<ReportResult>
        return this.http.post<ReportResult>(fullUrl, null, { params });
    }

    /**
     * Helper to ensure dates are sent in ISO format (YYYY-MM-DD)
     */
    private formatToIsoDate(date: Date | string): string {
        if (date instanceof Date) {
            return date.toISOString().split('T')[0]; // Converts Date object to YYYY-MM-DD
        }

        // Handles string input: converts DD/MM/YYYY or MM/DD/YYYY formats if needed
        if (date.includes('/')) {
            const parts = date.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        return date; // Assumes it's already YYYY-MM-DD
    }
}