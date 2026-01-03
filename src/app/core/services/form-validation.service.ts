import { Injectable, inject } from '@angular/core';
import { Wallet } from '../../model/wallet.model';

@Injectable({ providedIn: 'root' })
export class FormValidationService {

  private loadWallets(): Wallet[] {
    const walletsJson = localStorage.getItem('WALLETS');
    return walletsJson ? JSON.parse(walletsJson) as Wallet[] : [];
  }

  private splitPair(pairCode: string): [string, string] {
    const base = pairCode.substring(0, 3);
    const quote = pairCode.substring(3, 6);
    return [base, quote];
  }

  private getAvailableBalance(currencyCode: string): number {
    const wallets = this.loadWallets();
    const wallet = wallets.find(w => w.currencyCode === currencyCode);
    return wallet?.availableBalance ?? 0;
  }

  getMaxVolumeSell(pairCode: string): number {
    const [baseCurrency] = this.splitPair(pairCode);
    return this.getAvailableBalance(baseCurrency);
  }

  getMaxVolumeBuy(pairCode: string, price: number): number {
    if (price <= 0) return 0; 
    const [, quoteCurrency] = this.splitPair(pairCode);
    // When buying, you spend the QUOTE currency.
    const availableQuoteBalance = this.getAvailableBalance(quoteCurrency);
    // Max Base Currency Volume = (Available Quote Balance) / Price
    return availableQuoteBalance / price;
  }
}
