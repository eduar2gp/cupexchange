import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../model/account.model';
import { Observable, of } from 'rxjs'; // 'of' is used to return a safe empty array on error
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss',
})
export class AccountsListComponent implements OnInit {
  private accountsService = inject(AccountService);
  private router = inject(Router)
  
  // Use a $ suffix for Observables
  accounts$: Observable<Account[]> | undefined;
  isLoading = true;

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

   navigateToNewAccount() {
    this.router.navigate(['/add-account']);
  }
}