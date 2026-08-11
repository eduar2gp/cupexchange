import { Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../../app/core/services/reports.service';
import { MonthlyStatement } from '../../../model/monthly-statement.model';
import { Page } from '../../../model/page.model';
import { Component, inject, signal, computed, OnInit } from '@angular/core';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-provider-billing-reports',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    TranslateModule],
  templateUrl: './account-provider-billing-reports.html',
  styleUrl: './account-provider-billing-reports.scss',
})
export class AccountProviderBillingReports implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  // State Signals
  pageSize = signal(10);
  currentPage = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  accountId = signal<number | null>(null);

  displayedColumns: string[] = [
    'id',
    'statementPeriod',
    'balanceBefore',
    'balanceAfter',
    'generatedAt',
    'actions'
  ];

  ngOnInit(): void {
    // Listen to query parameters from router navigation: [queryParams]="{ accountId: row.id }"
    this.route.queryParamMap.subscribe(params => {
      const accountIdParam = params.get('accountId');
      this.accountId.set(accountIdParam ? parseInt(accountIdParam, 10) : null);
      this.currentPage.set(0); // Reset to first page when changing account filter
    });
  }

  // 1. Computed parameter object combining reactive signals
  private paramsSignal = computed(() => ({
    user: this.authService.currentUser$(),
    accountId: this.accountId(),
    page: this.currentPage(),
    size: this.pageSize()
  }));

  // 2. The Reactive Pipeline mapping parameter signals to paginated API resource
  private statementsResource = toSignal(
    toObservable(this.paramsSignal).pipe(
      // Ensure user is authenticated and accountId is set before fetching
      filter((p): p is { user: any; accountId: number; page: number; size: number } => !!p.user && p.accountId !== null),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(p =>
        this.reportService.getMonthlyStatements(p.accountId, p.page, p.size).pipe(
          catchError(() => {
            this.error.set('MONTHLY_STATEMENTS.ERROR_LOADING');
            return of(null);
          })
        )
      ),
      tap(() => this.loading.set(false))
    ),
    { initialValue: null }
  );

  // 3. Selectors for Template Rendering
  statements = computed(() => this.statementsResource()?.content ?? []);
  totalElements = computed(() => this.statementsResource()?.totalElements ?? 0);

  handlePageEvent(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  downloadPdf(pdfUrl: string): void {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  }

  refresh(): void {
    this.currentPage.set(0);
  }

  trackById(index: number, item: MonthlyStatement): number {
    return item?.id;
  }
}