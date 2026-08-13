import { Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ReportSuccessDialogComponent } from '../../shared/report-dialog/report-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportResult } from '../../../model/monthly-statement.model';

@Component({
  selector: 'app-account-provider-billing-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    TranslateModule,
    MatDialogModule
  ],
  templateUrl: './account-provider-billing-reports.html',
  styleUrl: './account-provider-billing-reports.scss',
})
export class AccountProviderBillingReports implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  // Form & Generate State
  statementForm!: FormGroup;
  isGenerating = signal(false);

  // State Signals
  pageSize = signal(10);
  currentPage = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  accountId = signal<number | null>(null);
  refreshTrigger = signal(0);

  displayedColumns: string[] = [
    'id',
    'statementPeriod',
    'balanceBefore',
    'balanceAfter',
    'generatedAt',
    'actions'
  ];

  // Role check for template visibility
  get hasAdminOrProviderRole(): boolean {
    const user = this.authService.currentUser$();
    const roles: string[] = user?.roles || [];
    const allowed = ['ROLE_ACCOUNT_MANAGER', 'ROLE_PROVIDER', 'ROLE_ADMIN'];
    return roles.some(role => allowed.includes(role.toUpperCase()));
  }

  ngOnInit(): void {
    this.initForm();

    // Listen to query parameters from router navigation: [queryParams]="{ accountId: row.id }"
    this.route.queryParamMap.subscribe(params => {
      const accountIdParam = params.get('accountId');
      this.accountId.set(accountIdParam ? parseInt(accountIdParam, 10) : null);
      this.currentPage.set(0); // Reset to first page when changing account filter
    });
  }

  private initForm(): void {
    this.statementForm = this.fb.group({
      filterType: ['daysBack'],
      daysBack: [10, [Validators.required, Validators.min(1)]],
      startDate: [null],
      endDate: [null]
    });

    this.statementForm.get('filterType')?.valueChanges.subscribe(type => {
      const daysBackCtrl = this.statementForm.get('daysBack');
      const startCtrl = this.statementForm.get('startDate');
      const endCtrl = this.statementForm.get('endDate');

      if (type === 'daysBack') {
        daysBackCtrl?.setValidators([Validators.required, Validators.min(1)]);
        startCtrl?.clearValidators();
        endCtrl?.clearValidators();
      } else {
        daysBackCtrl?.clearValidators();
        startCtrl?.setValidators([Validators.required]);
        endCtrl?.setValidators([Validators.required]);
      }

      daysBackCtrl?.updateValueAndValidity();
      startCtrl?.updateValueAndValidity();
      endCtrl?.updateValueAndValidity();
    });
  }

  generateMonthlyStatement(): void {
    const currentAccountId = this.accountId();
    if (this.statementForm.invalid || !currentAccountId) return;

    this.isGenerating.set(true);
    const { filterType, daysBack, startDate, endDate } = this.statementForm.value;

    const options = filterType === 'daysBack'
      ? { daysBack }
      : { 
          startDate: this.formatToIsoDate(startDate), 
          endDate: this.formatToIsoDate(endDate) 
        };

    this.reportService.postGenerateMonthlyStatement(currentAccountId, options).subscribe({
      next: (result: ReportResult) => {
        this.isGenerating.set(false);
        
        // Open Success Dialog
        const dialogRef = this.dialog.open(ReportSuccessDialogComponent, {
          width: '420px',
          data: result
        });

        // Trigger resource re-fetch when dialog is closed
        dialogRef.afterClosed().subscribe(() => {
          this.refresh();
        });
      },
      error: () => {
        this.isGenerating.set(false);
        this.error.set('MONTHLY_STATEMENTS.ERROR_GENERATING');
      }
    });
  }

  private formatToIsoDate(date: Date | string | null): string | undefined {
    if (!date) return undefined;
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  // 1. Computed parameter object combining reactive signals
  private paramsSignal = computed(() => ({
    user: this.authService.currentUser$(),
    accountId: this.accountId(),
    page: this.currentPage(),
    size: this.pageSize(),
    refresh: this.refreshTrigger()
  }));

  // 2. The Reactive Pipeline mapping parameter signals to paginated API resource
  private statementsResource = toSignal(
    toObservable(this.paramsSignal).pipe(
      // Ensure user is authenticated and accountId is set before fetching
      filter((p): p is { user: any; accountId: number; page: number; size: number; refresh: number } => 
        !!p.user && p.accountId !== null
      ),
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
    this.refreshTrigger.update(v => v + 1);
  }

  trackById(index: number, item: MonthlyStatement): number {
    return item?.id;
  }
}