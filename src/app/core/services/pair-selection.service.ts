import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { TradingPair } from '../../model/trading_pair';

@Injectable({
  providedIn: 'root'
})
export class PairSelectionService {

  // ✅ DEFAULT VALUE (same as before)
  private readonly defaultPair: TradingPair = {
    value: 'USDCUP',
    viewValue: 'USD',
    imageUrl: 'assets/currencies/usd.png'
  };

  // ✅ SIGNAL STATE (initialized like BehaviorSubject)
  private selectedPairSignal: WritableSignal<TradingPair | null> =
    signal(this.defaultPair);

  // ✅ PUBLIC READ
  public selectedPair = computed(() => this.selectedPairSignal());

  // =========================
  // SETTER (WITH SAME LOGIC)
  // =========================
  setSelectedPair(pair: TradingPair | null): void {
    const current = this.selectedPairSignal();
    const currentCode = current?.value ?? null;
    const newCode = pair?.value ?? null;

    console.log(`[PairSelectionService] Attempting to set pair:`, pair);
    console.log(`[PairSelectionService] Current pair code: ${currentCode}, New pair code: ${newCode}`);

    // ✅ SAME GUARD AS BEFORE
    if (newCode !== currentCode) {
      console.log(`[PairSelectionService] Pair changed → updating signal`, pair);
      this.selectedPairSignal.set(pair);
    } else {
      console.log(`[PairSelectionService] No change → skipping`);
    }
  }

  // =========================
  // OPTIONAL HELPERS (KEEP)
  // =========================
  getCurrentPair(): TradingPair | null {
    return this.selectedPairSignal();
  }

  getCurrentPairCode(): string | null {
    return this.selectedPairSignal()?.value ?? null;
  }
}