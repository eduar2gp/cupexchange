import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { ProviderBalance} from '../../../model/provider-balance.model';
import { Page } from '../../../model/page.model';

@Component({
  selector: 'app-account-provider-balance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-provider-balance.component.html',
  styleUrl: './account-provider-balance.component.scss',
})
export class AccountProviderBalanceComponent implements OnInit {
  private accountService = inject(AccountService);

  // Using Signals for modern Angular state management
  providerData = signal<ProviderBalance[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadBalances();
  }

  loadBalances(page: number = 0): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    this.accountService.getAccountProvidersBalances(page, this.pageSize()).subscribe({
      next: (response: Page<ProviderBalance>) => {
        this.providerData.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching provider balances', err);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.loadBalances(newPage);
  }
}