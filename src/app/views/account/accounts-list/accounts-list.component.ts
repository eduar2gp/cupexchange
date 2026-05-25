import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../model/account.model';
import { Observable, of } from 'rxjs'; // 'of' is used to return a safe empty array on error
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DialogMessageComponent } from '../../shared/dialog-message/dialog-message.component';
import { MatDialog } from '@angular/material/dialog';
import { UpdateWithdrawalFeeModel } from '../../../model/update-withdrawal-fee.model';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss',
})
export class AccountsListComponent implements OnInit {
  private accountsService = inject(AccountService);
  private router = inject(Router)
  private dialog = inject(MatDialog);

  // Use a $ suffix for Observables
  accounts$: Observable<Account[]> | undefined;
  isLoading = true;
  
  // Edit withdrawal fee state
  editingAccountId: number | null = null;
  editingFeeValue: number | null = null;
  isSaving = false;

  ngOnInit(): void {
    const userData = localStorage.getItem('USER_PROFILE_DATA');
    if (userData) {
      const user = JSON.parse(userData);
      // We assign the Observable directly
      this.accounts$ = this.accountsService.getAccounts(user).pipe(
        tap(() => this.isLoading = false),
        catchError(err => {
          this.isLoading = false;
          console.error(err);
          return of([]); // Return empty array on error
        })
      );
    }
  }

  checkBalance(accountId: number) {
    this.accountsService.getAccountBalance(accountId).subscribe({
      next: (res) => {
        const message = `
      Account: ${res.accountName || 'N/A'}
      Balance: ${res.calculatedBalance || 'N/A'}
      Currency: ${res.currencyCode || ''}
      `;
        this.dialog.open(DialogMessageComponent, {
          data: {
            title: 'Provider Balance',
            message: message
          }
        });

      },
      error: (err) => {
        console.error(err);

        this.dialog.open(DialogMessageComponent, {
          data: {
            title: 'Error',
            message: 'Unable to retrieve account balance.'
          }
        });
      }
    });
  }

  navigateToNewAccount() {
    this.router.navigate(['/add-account']);
  }

  startEdit(account: Account) {
    this.editingAccountId = account.id;
    this.editingFeeValue = account.withdrawalPercentageFee;
  }

  cancelEdit() {
    this.editingAccountId = null;
    this.editingFeeValue = null;
  }

  saveWithdrawalFee(account: Account) {
    if (this.editingFeeValue === null || this.editingFeeValue === undefined) {
      return;
    }

    this.isSaving = true;
    const updatePayload: UpdateWithdrawalFeeModel = {
      accountId: account.id,
      withdrawalPercentageFee: this.editingFeeValue
    };

    this.accountsService.updateWithdrawalFee(updatePayload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.editingAccountId = null;
        this.editingFeeValue = null;

        this.dialog.open(DialogMessageComponent, {
          data: {
            title: 'Success',
            message: 'Withdrawal fee updated successfully.'
          }
        });

        // Reload accounts
        const userData = localStorage.getItem('USER_PROFILE_DATA');
        if (userData) {
          const user = JSON.parse(userData);
          this.accounts$ = this.accountsService.getAccounts(user).pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.isLoading = false;
              console.error(err);
              return of([]);
            })
          );
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);

        this.dialog.open(DialogMessageComponent, {
          data: {
            title: 'Error',
            message: 'Failed to update withdrawal fee.'
          }
        });
      }
    });
  }
}