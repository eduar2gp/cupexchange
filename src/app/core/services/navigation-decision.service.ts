import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Wallet } from '../../model/wallet.model'
import { User } from '../../model/user.model';

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

  /**
   * Verifies if all essential user profile data is available.
   * @returns An Observable<boolean> that emits true if data is complete, false otherwise.
   */
  verifyProfile(): Observable<boolean> { // Change return type to Observable<boolean>
    let loggedInUser: User | undefined;
    const savedProfileJson = localStorage.getItem('USER_PROFILE_DATA');

    // 1. Check for stored user data
    if (savedProfileJson) {
      loggedInUser = JSON.parse(savedProfileJson) as User;
    } else {
      console.error('User data not found in localStorage.');
      // Return Observable<false> immediately if no user data is stored
      return of(false);
    }

    // 2. Define the essential fields to verify
    const verifyProfileData = {
      firstName: loggedInUser.firstName,
      lastName: loggedInUser.lastName,
      phone: loggedInUser.phone,
      address: loggedInUser.address,
      municipality: loggedInUser.municipality,
      province: loggedInUser.province,
    };

    // 3. Check for missing data
    const isProfileComplete = Object.values(verifyProfileData).every(
      (value) => value !== null && value !== undefined && value !== ''
    );

    if (!isProfileComplete) {
      console.warn('Missing data in user profile.');
      // Return Observable<false> if any essential field is missing
      return of(false);
    }

    // Return Observable<true> if all essential fields are present
    return of(true);
  }
}
