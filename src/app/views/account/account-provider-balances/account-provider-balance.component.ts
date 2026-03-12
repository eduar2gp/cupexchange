import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { ProviderBalance } from '../../../model/provider-balance.model';
import { Page } from '../../../model/page.model';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-account-provider-balance',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './account-provider-balance.component.html',
  styleUrl: './account-provider-balance.component.scss',
})
export class AccountProviderBalanceComponent implements OnInit {

  private accountService = inject(AccountService);

  providerData = signal<ProviderBalance[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  isLoading = signal(false);

  displayedColumns = ['accountName','gatewayId','currency','balance'];

  totalPages = computed(() =>
    Math.ceil(this.totalElements() / this.pageSize())
  );

  ngOnInit(): void {
    this.loadBalances();
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
}