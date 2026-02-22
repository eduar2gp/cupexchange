import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AccountService } from '../../../core/services/account.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Account } from '../../../model/account.model';
import { PaymentGateway } from '../../../model/payment-gateway.model';

@Component({
  selector: 'app-add-account',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './add-account.component.html',
  styleUrl: './add-account.component.scss'
})
export class AddAccountComponent implements OnInit {
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  account: Partial<Account> = { baseCurrency: 'USD' };
  paymentGateways: PaymentGateway[] = [];
  selectedGatewayCode: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.loadGateways('USD');
  }

  selectCurrency(currency: string) {
    if (this.account.baseCurrency !== currency) {
      this.account.baseCurrency = currency;
      this.selectedGatewayCode = null;
      this.account.paymentGatewayId = undefined;
      this.account.accountId = ''; 
      this.paymentGateways = [];
      this.loadGateways(currency);
    }
  }

  loadGateways(currency: string) {
    this.isLoading = true;
    this.transactionService.getPaymentGateways(currency).subscribe({
      next: (res) => {
        this.paymentGateways = [...res];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectGateway(gateway: PaymentGateway) {
    this.selectedGatewayCode = gateway.gatewayCode!;
    this.account.paymentGatewayId = gateway.id;
    this.applyPrefix();
  }

  applyPrefix() {
    // Safety check and casting to string to avoid TS2339
    let currentId = String(this.account.accountId || '');
    const code = this.selectedGatewayCode?.toUpperCase();
    
    if (code === 'CHIME' || code === 'CASHAPP') {
      if (!currentId.startsWith('$')) {
        this.account.accountId = '$' + currentId.replace(/^[@]/, '');
      }
    } else if (code === 'PAYPAL') {
      if (!currentId.startsWith('@')) {
        this.account.accountId = '@' + currentId.replace(/^[$]/, '');
      }
    }
  }

  onSubmit() {
    if (!this.selectedGatewayCode) return;
    this.isLoading = true;
    this.accountService.addAccount(this.account).subscribe({
      next: () => {
        this.snackBar.open('Account added successfully', 'OK', { duration: 3000 });
        this.router.navigate(['/accounts']);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Unauthorized'), 'Close');
      }
    });
  }

  getFieldStatus(fieldName: string): 'HIDDEN' | 'OPTIONAL' | 'MANDATORY' {
    const currency = this.account.baseCurrency;
    const gateway = this.selectedGatewayCode;

    // Full name is now mandatory for everything
    if (fieldName === 'userName') return 'MANDATORY';

    if (currency === 'CUP') {
      if (fieldName === 'cardNumber') return 'MANDATORY';
      return 'HIDDEN';
    }

    if (currency === 'USD') {
      if (gateway === 'ZELLE') {
        if (fieldName === 'phone') return 'MANDATORY';
        if (fieldName === 'email') return 'OPTIONAL';
        return 'HIDDEN';
      } else {
        if (fieldName === 'accountId') return 'MANDATORY';
        return 'HIDDEN';
      }
    }
    return 'OPTIONAL';
  }

  isVisible(field: string): boolean { return this.getFieldStatus(field) !== 'HIDDEN'; }
  isRequired(field: string): boolean { return this.getFieldStatus(field) === 'MANDATORY'; }
}