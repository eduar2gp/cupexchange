import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TradingPair } from '../../model/trading_pair';

@Injectable({
  providedIn: 'root'
})
export class PairSelectionService {

  // Private BehaviorSubject holding the current TradingPair (or null if none selected)
  private selectedPairSubject = new BehaviorSubject<TradingPair | null>({ value: 'USDCUP', viewValue: 'USD', imageUrl: 'assets/currencies/usd.png' });

  // Public observable that components can subscribe to
  selectedPair$ = this.selectedPairSubject.asObservable();

  /**
 * Sets the currently selected trading pair
 * @param pair The full TradingPair object (or null to clear selection)
 */
  setSelectedPair(pair: TradingPair | null): void {
    const current = this.selectedPairSubject.getValue();
    const currentCode = current?.value ?? null;
    const newCode = pair?.value ?? null;

    // Helpful debug logs
    console.log(`[PairSelectionService] Attempting to set pair:`, pair);
    console.log(`[PairSelectionService] Current pair code: ${currentCode}, New pair code: ${newCode}`);

    // Only emit if the pair actually changed
    if (newCode !== currentCode) {
      console.log(`[PairSelectionService] Pair changed → emitting new pair:`, pair);
      this.selectedPairSubject.next(pair);
    } else {
      console.log(`[PairSelectionService] No change → same pair or both null, skipping emission`);
    }
  }

  /**
   * Optional: Get current pair synchronously
   */
  getCurrentPair(): TradingPair | null {
    return this.selectedPairSubject.getValue();
  }

  /**
   * Optional: Get just the current pair code (useful for localStorage)
   */
  getCurrentPairCode(): string | null {
    return this.selectedPairSubject.getValue()?.value ?? null;
  }
}
