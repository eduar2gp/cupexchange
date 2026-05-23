import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../../core/services/account.service';
import { ProviderBalance } from '../../../model/provider-balance.model';
import { Page } from '../../../model/page.model';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WalletService } from '../../../core/services/wallet.service';
import { Wallet } from '../../../model/wallet.model';
import { CurrencySummary } from '../../../model/currency-summary.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-account-provider-balance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    MatProgressBarModule
  ],
  templateUrl: './account-provider-balance.component.html',
  styleUrl: './account-provider-balance.component.scss',
})
export class AccountProviderBalanceComponent implements OnInit {

  private accountService = inject(AccountService);
  private walletService = inject(WalletService);

  providerData = signal<ProviderBalance[]>([]);
  systemWallets = signal<Wallet[]>([]);
  currencySummary = signal<CurrencySummary[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  isLoading = signal(false);
  isLoadingWallets = signal(false);
  isLoadingCurrencySummary = signal(false);

  displayedColumns = ['accountName','gatewayId','currency','balance','actions'];

  totalPages = computed(() =>
    Math.ceil(this.totalElements() / this.pageSize())
  );

  ngOnInit(): void {
    this.loadBalances();
    this.loadSystemWallets();
    this.loadCurrencySummary();
  }

  loadBalances(page: number = 0): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    this.accountService
      .getAccountProvidersBalances(page, this.pageSize())
      .subscribe({
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

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.loadBalances(event.pageIndex);
  }

  loadSystemWallets(): void {
    this.isLoadingWallets.set(true);
    this.walletService.getSystemWallets().subscribe({
      next: (wallets: Wallet[]) => {
        this.systemWallets.set(wallets);
        this.isLoadingWallets.set(false);
      },
      error: (err) => {
        console.error('Error fetching system wallets', err);
        this.isLoadingWallets.set(false);
      }
    });
  }

  loadCurrencySummary(): void {
    this.isLoadingCurrencySummary.set(true);
    this.walletService.getCurrencySummary().subscribe({
      next: (summary: CurrencySummary[]) => {
        this.currencySummary.set(summary);
        this.isLoadingCurrencySummary.set(false);
      },
      error: (err) => {
        console.error('Error fetching currency summary', err);
        this.isLoadingCurrencySummary.set(false);
      }
    });
  }

  getCurrencyImage(currencyCode: string | undefined): string {
    if (!currencyCode) {
      return 'assets/currencies/default.png';
    }
    const currency = currencyCode.toLowerCase();
    return `assets/currencies/${currency}.png`;
  }
}