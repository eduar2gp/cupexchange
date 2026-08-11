import { build, ApiEndpoints } from '../../../app/core/api/endpoints';
import { Injectable } from '@angular/core';
import { Page } from '../../model/page.model';
import { MonthlyStatement } from '../../model/monthly-statement.model';
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
}