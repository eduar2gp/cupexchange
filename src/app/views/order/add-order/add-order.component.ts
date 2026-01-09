import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, Validators } from '@angular/forms'; // Added Validators
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar'; // Though not used, good to keep

import { OrderTrade } from '../../../model/order_trade.model';
import { TradingPair } from '../../../model/trading_pair';
import { Wallet } from '../../../model/wallet.model'; // Import Wallet model

import { DataService } from '../../../core/services/data.service';
import { OrderTradeService } from '../../../core/services/order-trade.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';
import { FormValidationService } from '../../../../app/core/services/form-validation.service'; // Use relative path
import { ThemeService } from '../../../../app/core/services/theme-service';

import { Subscription } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { DialogMessageComponent } from '../../shared/dialog-message/dialog-message.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderBookComponent } from '../orders-book/orders-book.component'

interface Type {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-add-order',
  standalone: true,
  imports: [
    OrderBookComponent,
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    TranslateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-order.component.html',
  styleUrl: './add-order.component.css',
})
export class AddOrderComponent implements OnInit, OnDestroy {
  // Services
  private dataService = inject(DataService);
  private orderTradeService = inject(OrderTradeService);
  private walletService = inject(WalletService);
  private pairSelectionService = inject(PairSelectionService);
  private themeService = inject(ThemeService);
  private formValidationService = inject(FormValidationService);
 

  // --- Component Properties ---
  private pairSub!: Subscription;
  currentPair: TradingPair | null = null;
  newOrder: OrderTrade = {
    username: '',
    pairCode: 'CUPUSD',
    side: 'BUY',
    type: 'MARKET',
    price: 0.0025,
    volume: 0.01,
  };

  // State for Max Volume Calculation
  maxVolumeSell = 0; // Max volume based on base currency balance
  maxVolumeBuy = 0;  // Max volume based on quote currency balance / price

  volumeInput = ''; // Input string for display/formatting

  types: Type[] = [
    { value: 'LIMIT', viewValue: 'Límite' },
    { value: 'MARKET', viewValue: 'Mercado' },
  ];

  // Trading pair constraints
  sliderMin = 4;
  sliderMax = 1000;
  sliderStep = 4;
  minVolume = 0.01;

  loading = signal(false);

  constructor(private dialog: MatDialog, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.volumeInput = this.newOrder.volume.toFixed(2); // Initialize volume input

    this.pairSub = this.pairSelectionService.selectedPair$.subscribe(pair => {
      if (pair) {
        this.currentPair = pair;
        this.newOrder.pairCode = pair.value;

        // --- 1. Update Constraints (Moved to a separate, cleaner method) ---
        this.updateTradingConstraints(pair);

        // --- 2. Recalculate Max Volumes on Pair/Price Change ---
        this.updateMaxVolumes();
      }
    });
  }

  ngOnDestroy(): void {
    this.pairSub?.unsubscribe();
  }

  // --- Helper Methods for Initialization and Updates ---

  private updateTradingConstraints(pair: TradingPair): void {
    // Set price range logic based on the pair code
    if (pair.value === 'USDCUP') {
      this.sliderMin = pair.min ?? 4;
      this.sliderMax = pair.max ?? 1000;
    } else { // Default or CUPUSD
      this.sliderMin = pair.min ?? 0.0010;
      this.sliderMax = pair.max ?? 0.0040;
    }
    this.sliderStep = pair.step ?? 4;
    this.minVolume = pair.minVolume ?? 0.01;
    this.newOrder.volume = pair.minVolume || 0.01;
    this.volumeInput = this.newOrder.volume.toFixed(2);

    // Reset price for MARKET or if outside new range
    if (this.newOrder.type === 'MARKET' || this.newOrder.price < this.sliderMin) {
      this.newOrder.price = this.sliderMin;
    }
  }

  private updateMaxVolumes(): void {
    if (this.currentPair) {
      // Max Sell Volume depends only on BASE currency balance (e.g., CUP in CUPUSD)
      this.maxVolumeSell = this.formValidationService.getMaxVolumeSell(this.currentPair.value);

      // Max Buy Volume depends on QUOTE currency balance and PRICE (e.g., USD in CUPUSD)
      // Use the current order price for calculation (relevant for LIMIT orders)
      this.maxVolumeBuy = this.formValidationService.getMaxVolumeBuy(
        this.currentPair.value,
        this.newOrder.price
      );
    }
  }

  // Listener for price/type changes to dynamically update Max Buy Volume
  onOrderModelChange(): void {
    if (this.currentPair) {
      // Only update Buy Max if price or type changed
      this.updateMaxVolumes();
    }
  }

  // --- Event Handlers ---

  onTabChange(event: MatTabChangeEvent): void {
    this.newOrder.side = event.index === 0 ? 'BUY' : 'SELL';
    this.updateMaxVolumes(); // Recalculate/refresh max volumes when switching sides
  }


  // --- Submission and Error Handling (simplified) ---

  saveOrder(form: NgForm): void {
    // Before submission, ensure the volume is within the balance limits
    if (this.isVolumeExceeded(form)) {
      // The template handles invalid state, but we can prevent submission here too
      return;
    }

    if (form.valid && this.currentPair) {
      // ... (Original subscription logic remains the same for submission)
      this.dataService.currentUser
        .pipe(
          filter(user => user !== null),
          take(1),
          switchMap(user => {
            if (user && user.userId) {
              this.newOrder.username = user.username;
              this.loading.set(true);
              return this.orderTradeService.saveOrder(this.newOrder);
            }
            return of(null);
          })
        )
        .subscribe({
          // ... (next and error handlers)
          next: (response) => {
            // Refresh wallets after successful order
           // this.walletService.triggerUpdate();
            // ... (dialog logic and form reset)
            this.loading.set(false);
            this.dataService.triggerWalletUpdate()
            let successMessage = (response as any)?.message || (response as any)?.msg || 'Order saved successfully!';
            this.dialog.open(DialogMessageComponent, {
              width: '400px',
              data: { title: 'Confirmación!', message: successMessage }
            });
            form.resetForm({
              pairCode: this.newOrder.pairCode,
              side: this.newOrder.side,
              type: 'MARKET',
              price: this.sliderMin,
              volume: this.minVolume,
            });
          },
          error: (err) => {
            // ... (error handling logic)
            this.loading.set(false);
            let errorMessage = err?.error?.message || err?.error?.msg || err?.message || 'Failed to save order. Please try again.';
            this.dialog.open(DialogMessageComponent, {
              width: '400px',
              data: { title: 'Error', message: errorMessage }
            });
          }
        });
    }
  }

  // --- Validation Logic for Template ---

  // Checks if the current volume exceeds the max volume for the current side (Buy/Sell)
  isVolumeExceeded(form: NgForm): boolean {
    if (!form || !this.currentPair) return false;

    const currentVolume = this.newOrder.volume;
    const maxVolume = this.newOrder.side === 'BUY' ? this.maxVolumeBuy : this.maxVolumeSell;

    // Allow a tiny tolerance for floating point math
    return currentVolume > maxVolume + 1e-9;
  }

  // Helper to get the correct max volume for display/validation
  getCurrentMaxVolume(): number {
    return this.newOrder.side === 'BUY' ? this.maxVolumeBuy : this.maxVolumeSell;
  }

  formatPriceDisplay(price: number): SafeHtml { // <-- Return type is now SafeHtml
    if (price === undefined || price === null || isNaN(price)) {
      return this.sanitizer.bypassSecurityTrustHtml('N/A'); // Sanitize plain text fallback
    }

    let priceString
    if(this.currentPair?.viewValue === 'CUP')
      priceString = price.toFixed(4);
    else
      priceString = price.toFixed(0);


    const parts = priceString.split('.');

    if (parts.length < 2) {
      // Return original string sanitized, if for some reason toFixed failed
      return this.sanitizer.bypassSecurityTrustHtml(priceString);
    }

    const integerPart = parts[0];
    const decimalPart = parts[1]; // Will be exactly 4 digits long

    // 2. Define the split point for small numbers (e.g., after the first two decimals)
    const largeDecimals = decimalPart.substring(0, 2); // First two digits
    const smallDecimals = decimalPart.substring(2); // Last two digits

    // 3. Construct the HTML string
    const htmlString = `$${integerPart}.${largeDecimals}<span class="small-decimals">${smallDecimals}</span>`;

    // 4. Bypass security checks for this specific HTML string
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  formatPairDisplay(pair: string | undefined): string {
    if (pair)
      return pair?.substring(0, 3) + " - " + pair?.substring(3, pair.length);
    return '';
  }

  // Called on every input change
  onVolumeInput(value: string): void {
    this.volumeInput = value; // keep exactly what user typed
    const parsed = Number(value.replace(/,/g, ''));

    // Important: If input is empty or invalid (e.g., just a dot), 
    // assign null or 0 to the model to trigger Angular's 'required' validator if needed.
    if (isNaN(parsed) || value.trim() === '') {
      this.newOrder.volume = 0; // Set to 0 to easily trigger required/min validation
    } else {
      this.newOrder.volume = parsed; // numeric model
    }
  }

  formatVolumeOnBlur(): void {
    const volume = this.newOrder.volume;

    if (volume !== null && volume !== undefined && !isNaN(volume)) {
      const precision = 2; 
      this.volumeInput = this.formatNumberToLocale(volume, precision);
    } else {
      // Ensure input is cleared or set to a standard empty state if the model is invalid/null
      this.volumeInput = '';
    }
  }

  private formatNumberToLocale(value: number, precision: number = 2): string {
    if (isNaN(value)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(value);
  }

  getThemeClass(): string {
    let themeName: string;
    if (this.themeService.isDark()) {      
      themeName = 'dark';
    } else {     
      themeName = 'light';
    }    
    return `mat-theme-${themeName}`;
  }

  getBaseCurrencyImage(pair: string | undefined): string {
    if (!pair || pair.length < 6) {
      return 'assets/currencies/default.png';
    }
    const baseCurrency = pair.substring(0, 3).toLowerCase();
    return `assets/currencies/${baseCurrency}.png`;
  }


  getQuoteCurrencyImage(pair: string | undefined): string {
    if (!pair || pair.length < 6) {
      return 'assets/currencies/default.png';
    }
    const quoteCurrency = pair.substring(3, pair.length).toLowerCase();
    return `assets/currencies/${quoteCurrency}.png`;
  }
}
