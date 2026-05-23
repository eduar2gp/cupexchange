import { Component, inject, OnInit, signal } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { TransactionManagerResponse } from '../../../model/transaction-manager.model';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionConfirmDialogComponent } from '../../../views/shared/confirm-transaction-dialog/transaction-confirm-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule],
  templateUrl: './transaction-details.component.html',
  styleUrl: './transaction-details.component.scss',
})
export class TransactionDetailsComponent implements OnInit {
  private dataService = inject(DataService);
  private userService = inject(UserService);
  private transactionService = inject(TransactionService);
  private readonly dialog = inject(MatDialog);

  isLoading = signal<boolean>(false);
  transaction = signal<TransactionManagerResponse | null>(null);
  private tx$ = toObservable(this.transaction);
  private snackbar = inject(MatSnackBar);

  userProfile = toSignal(
    this.tx$.pipe(
      map((tx) => (tx?.method === 'CASH' ? tx.managedById : null)),
      distinctUntilChanged(),
      switchMap((id) => (id ? this.userService.getUserProfile(id) : of(null)))
    ),
    { initialValue: null }
  );

  ngOnInit(): void {
    const transaction = this.dataService.getCurrentTransaction();
    this.transaction.set(transaction);
  }

  onStatusChanged() {
    const tx = this.transaction(); // Get current signal value
    if (!tx) return;

    const dialogRef = this.dialog.open(TransactionConfirmDialogComponent, {
      width: '400px',
      data: { id: tx.id, type: tx.type },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action) {
        this.processAction(tx, result.action, result.reason);
      }
    });
  }

  private processAction(tx: TransactionManagerResponse, action: 'CONFIRM' | 'REJECT', reason?: string): void {
    const actionString = action === 'CONFIRM'
      ? (tx.type === 'DEPOSIT' ? 'CONFIRM_DEPOSIT' : 'CONFIRM_WITHDRAWAL')
      : 'REJECT';

    this.isLoading.set(true);

    this.transactionService.processTransactionAction({
      transactionId: tx.id,
      action: actionString as any,
      reason: reason || ''
    }).subscribe({
      next: (response: string) => { // Explicitly typing the response as string
        // Update the signal manually by merging current values with the new status
        this.snackbar.open(response, "Success", { duration: 3000 });
        this.transaction.update(current => {
          if (!current) return null;
          return {
            ...current,
            status: action === 'CONFIRM' ? 'COMPLETED' : 'REJECTED'
          };
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.open(err.error, "Error", { duration: 3000 });
      }
    });
  }

  getCurrencyImage(currencyCode: string | null): string {
    if (!currencyCode) {
      return 'assets/currencies/default.png';
    }
    const currency = currencyCode.toLowerCase();
    return `assets/currencies/${currency}.png`;
  }
}