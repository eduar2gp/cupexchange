import { Injectable } from '@angular/core';
import { Wallet } from '../../model/wallet.model'

@Injectable({ providedIn: 'root' })
export class NavigationDecisionService {

  wallets: Wallet[] = [];

  private splitPair(pairValue: string): [string, string] | null {
    if (!pairValue || pairValue.length !== 6) {
      console.error('Invalid trading pair value received:', pairValue);
      return null;
    }
    const baseCurrency = pairValue.substring(0, 3);
    const quoteCurrency = pairValue.substring(3, 6);
    return [baseCurrency, quoteCurrency];
  }

  verifyWallets(currentPair: string | undefined): boolean {
    const walletsJson = localStorage.getItem('WALLETS');
    this.wallets = walletsJson ? JSON.parse(walletsJson) as Wallet[] : [];
    if (!currentPair) {
      console.warn('No current trading pair is selected.');
      return false;
    }
    const pairCodes = this.splitPair(currentPair);
    if (!pairCodes) {
      return false; 
    }
    const [baseCurrency, quoteCurrency] = pairCodes;
    const hasBaseWallet = this.wallets.some(
      wallet => wallet.currencyCode === baseCurrency
    );
    const hasQuoteWallet = this.wallets.some(
      wallet => wallet.currencyCode === quoteCurrency
    );
    return hasBaseWallet && hasQuoteWallet;
  }
}
