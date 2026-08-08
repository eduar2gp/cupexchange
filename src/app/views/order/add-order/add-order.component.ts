import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OrderTrade } from '../../../model/order_trade.model';
import { TradingPair } from '../../../model/trading_pair';
import { User } from '../../../model/user.model';

import { DataService } from '../../../core/services/data.service';
import { OrderTradeService } from '../../../core/services/order-trade.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';
import { FormValidationService } from '../../../../app/core/services/form-validation.service';
import { ThemeService } from '../../../../app/core/services/theme-service';

import { Subscription, of } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';

import { DialogMessageComponent } from '../../shared/dialog-message/dialog-message.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrderBookComponent } from '../exchange-orders-book/orders-book.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

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
    MatCardModule
  ],
  templateUrl: './add-order.component.html',
  styleUrl: './add-order.component.scss',
})
export class AddOrderComponent implements OnInit, OnDestroy {
  // Services
  private dataService = inject(DataService);
  private orderTradeService = inject(OrderTradeService);
  private walletService = inject(WalletService);
  private pairSelectionService = inject(PairSelectionService);
  private themeService = inject(ThemeService);
  private formValidationService = inject(FormValidationService);

  sliderReady = signal(false);

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

  maxVolumeSell = 0;
  maxVolumeBuy = 0;
  volumeInput = '';

  types: Type[] = [
    { value: 'LIMIT', viewValue: 'Límite' },
    { value: 'MARKET', viewValue: 'Mercado' },
  ];

  sliderMin = 0.0010;
  sliderMax = 0.0040;
  sliderStep = 0.0001;
  minVolume = 0.01;

  sliderConstraints = signal({
    min: 0.0010,
    max: 0.0040,
    step: 0.0001
  });

  loading = signal(false);

  constructor(
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private router: Router
  ) { 
    effect(() => {
      const pair = this.pairSelectionService.selectedPair();

      if (!pair) return;

      this.sliderReady.set(false);
      this.applyPairUpdate(pair);
      setTimeout(() => this.sliderReady.set(true), 0);
    });
  }

  ngOnInit(): void {
    const initialPair = this.pairSelectionService.getCurrentPair();
    if (initialPair) {
      this.applyPairUpdate(initialPair);
    }

    setTimeout(() => {
      this.sliderReady.set(true);
    }, 100);
  }

  // 3. Extract the logic to a reusable helper to avoid duplication
  private applyPairUpdate(pair: TradingPair): void {
    // 2. Hide the slider temporarily
    this.sliderReady.set(false);

    this.currentPair = pair;
    this.newOrder.pairCode = pair.value;
    this.updateTradingConstraints(pair);
    this.updateMaxVolumes();

    // 3. Use setTimeout to wait for the next change detection cycle
    // This forces the slider to be recreated with the NEW sliderStep
    setTimeout(() => {
      this.sliderReady.set(true);
    }, 0);
  }

  ngOnDestroy(): void {
    this.pairSub?.unsubscribe();
  }

  private updateTradingConstraints(pair: TradingPair): void {
    // 3. Force Step to be a standard number to resolve 1.0E-4 issues
    const rawStep = Number(pair.step);

    if (pair.value === 'CUPUSD') {
      this.sliderMin = 0.0010;
      this.sliderMax = 0.0040;
      this.sliderStep = rawStep || 0.0001;
      this.minVolume = pair.minVolume ?? 4.0; // Set to 4.0 as per your JSON
    } else if (pair.value === 'MLCCUP' || pair.value === 'USDCUP') {
      this.sliderMin = 4;
      this.sliderMax = 1000;
      this.sliderStep = rawStep || 4.0;
      this.minVolume = pair.minVolume ?? 0.01;
    } else {
      this.sliderMin = 0.01;
      this.sliderMax = 100;
      this.sliderStep = rawStep || 1.0;
      this.minVolume = pair.minVolume ?? 0.1;
    }

    // Sync the numeric model and input string
    this.newOrder.volume = this.minVolume;
    this.volumeInput = this.formatNumberToLocale(this.newOrder.volume, 2);

    // Ensure price is valid within constraints before slider renders
    if (this.newOrder.price < this.sliderMin || this.newOrder.price > this.sliderMax) {
      this.newOrder.price = this.sliderMin;
    }
  }

  private updateMaxVolumes(): void {
    if (this.currentPair) {
      const rawSell = this.formValidationService.getMaxVolumeSell(this.currentPair.value);
      const rawBuy = this.formValidationService.getMaxVolumeBuy(
        this.currentPair.value,
        this.newOrder.price
      );

      // Round to 8 decimal places to kill infinite floats (like 0.33333333333334)
      this.maxVolumeSell = parseFloat(rawSell.toFixed(8));
      this.maxVolumeBuy = parseFloat(rawBuy.toFixed(8));
    }
  }

  onOrderModelChange(): void {
    this.updateMaxVolumes();
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.newOrder.side = event.index === 0 ? 'BUY' : 'SELL';
    this.updateMaxVolumes();
  }

  // --- REFACTORED DIALOG LOGIC ---

  openConfirmDialog(form: NgForm): void {
    if (form.valid && this.currentPair) {
      if (this.newOrder.type === 'MARKET') {
        // Show loading while estimating if desired, though usually fast
        this.orderTradeService.getMarketOrderTotalPriceEstimated(
          this.newOrder.volume,
          this.newOrder.side,
          this.newOrder.pairCode
        ).subscribe({
          next: (totalPrice: string) => {
            const totalFormatted = (+totalPrice).toFixed(2);
            const translateKey = this.newOrder.side === 'BUY' ? 'EXPECTED_COST' : 'EXPECTED_PURCHASE';
            this.processConfirmation(totalFormatted, form, translateKey);
          },
          error: (err) => {
            // Extract error message from server response
            const errorMessage = err.error || 'Could not estimate market price. There might not be enough liquidity.';

            this.dialog.open(DialogMessageComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message: errorMessage
              }
            });
          }
        });
      } else {
        const totalFormatted = (this.newOrder.price * this.newOrder.volume).toFixed(2);
        this.processConfirmation(totalFormatted, form, 'TOTAL');
      }
    }
  }

  private processConfirmation(total: string, form: NgForm, translateKey: string): void {
    const sideKey = this.newOrder.side.toString(); // "BUY" or "SELL"

    // 1. Add sideKey to the array of requested translations
    this.translate.get(['CONFIRM', translateKey, sideKey], { total }).subscribe((translations: any) => {

      const dialogData: ConfirmDialogData = {
        title: translations['CONFIRM'] || 'Confirm Order',
        message:
          // 2. Access the translated side (e.g., "Compra" or "Venta")
          `${translations[sideKey]} ${this.newOrder.volume} ${this.formatPairDisplay(this.newOrder.pairCode)}\n` +
          (this.newOrder.type === 'LIMIT' ? `${this.translate.instant('PRICE')}: ${this.newOrder.price}\n` : '') +
          `${translations[translateKey]}: ${this.newOrder.side === 'BUY' ? '-' + total : '+' + total} ${this.formatPairDisplayQuote(this.newOrder.pairCode)}`
      }

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: dialogData,
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.saveOrder(form);
        }
      });
    });
  }

  saveOrder(form: NgForm): void {
    if (this.isVolumeExceeded(form)) return;

    if (form.valid && this.currentPair) {
      this.dataService.currentUser
        .pipe(
          filter((user): user is User => user !== null),
          take(1),
          switchMap((user: User) => {
            if (user && user.id) {
              this.newOrder.username = user.username;
              this.loading.set(true);
              return this.orderTradeService.saveOrder(this.newOrder);
            }
            return of(null);
          })
        )
        .subscribe({
          next: (response: any) => {
            this.loading.set(false);
            this.dataService.triggerWalletUpdate();
            const successMessage = response || 'Order saved successfully!';
            const dialogRef = this.dialog.open(DialogMessageComponent, {
              width: '400px',
              data: {
                title: 'Confirmación!',
                message: successMessage
              }
            });
            dialogRef.afterClosed().subscribe((confirmed: boolean) => {
              if (confirmed) {
                this.router.navigate(['/orders']);
              }
            });
            //form.resetForm({
            //  pairCode: this.newOrder.pairCode,
            //  side: this.newOrder.side,
            //  type: 'MARKET',
            //  price: this.sliderMin,
            //  volume: this.minVolume,
            //});
          },
          error: (err) => {
            this.loading.set(false);
            let errorMessage = err?.error?.message || err?.error?.msg || err?.message || 'Failed to save order.';
            this.dialog.open(DialogMessageComponent, {
              width: '400px',
              data: { title: 'Error', message: errorMessage }
            });
          }
        });
    }
  }

  // --- Utilities ---

  isVolumeExceeded(form: NgForm): boolean {
    if (!form || !this.currentPair) return false;

    const maxVolume = this.newOrder.side === 'BUY' ? this.maxVolumeBuy : this.maxVolumeSell;

    // Round both values to 2 decimal places specifically
    const vol = Math.round(this.newOrder.volume * 100) / 100;
    const max = Math.round(maxVolume * 100) / 100;

    // Now, if vol is 100.01 and max is 100.01, it returns false (Correct)
    return vol > max;
  }

  getCurrentMaxVolume(): number {
    return this.newOrder.side === 'BUY' ? this.maxVolumeBuy : this.maxVolumeSell;
  }

  formatPriceDisplay(price: number): SafeHtml {
    if (price === undefined || price === null || isNaN(price)) {
      return this.sanitizer.bypassSecurityTrustHtml('N/A');
    }

    let priceString = this.currentPair?.viewValue === 'CUP' ? price.toFixed(4) : price.toFixed(0);
    const parts = priceString.split('.');
    if (parts.length < 2) return this.sanitizer.bypassSecurityTrustHtml(priceString);

    const integerPart = parts[0];
    const decimalPart = parts[1];
    const largeDecimals = decimalPart.substring(0, 2);
    const smallDecimals = decimalPart.substring(2);

    const htmlString = `$${integerPart}.${largeDecimals}<span class="small-decimals">${smallDecimals}</span>`;
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  onVolumeInput(value: string | null): void {
    if (!value) {
      this.newOrder.volume = 0;
      return;
    }
    this.volumeInput = value;
    const parsed = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(parsed)) {
      // Rounding here prevents the "10.00000000000004" issue during typing
      this.newOrder.volume = parseFloat(parsed.toFixed(6));
    }
  }

  onVolumeBlur(): void {
    let valueToBound = this.newOrder.volume || 0;
    const max = this.getCurrentMaxVolume();

    if (valueToBound > max) {
      // Round max to 2 decimals when assigning it back to the model
      valueToBound = Math.round(max * 100) / 100;
    }

    this.newOrder.volume = valueToBound;
    this.volumeInput = this.formatNumberToLocale(valueToBound, 2);
  }

  private formatNumberToLocale(value: number, precision: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(isNaN(value) ? 0 : value);
  }

  getThemeClass(): string {
    return `mat-theme-${this.themeService.isDark() ? 'dark' : 'light'}`;
  }

  getBaseCurrencyImage(pair: string | undefined): string {
    if (!pair || pair.length < 6) return 'assets/currencies/default.png';
    return `assets/currencies/${pair.substring(0, 3).toLowerCase()}.png`;
  }

  getQuoteCurrencyImage(pair: string | undefined): string {
    if (!pair || pair.length < 6) return 'assets/currencies/default.png';
    return `assets/currencies/${pair.substring(3).toLowerCase()}.png`;
  }

  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowedKeys.indexOf(event.key) !== -1) return;
    const isNumber = /[0-9]/.test(event.key);
    const isDecimal = event.key === '.' && !this.volumeInput.includes('.');
    if (!isNumber && !isDecimal) event.preventDefault();
  }
  // Formats "CUPUSD" to "CUP - USD" for the UI label
  formatPairDisplay(pair: string | undefined): string {
    if (pair && pair.length >= 6) {
      return pair.substring(0, 3);
    }
    return pair || '';
  }
  formatPairDisplayQuote(pair: string | undefined): string {
    if (pair && pair.length >= 6) {
      return pair.substring(3);
    }
    return pair || '';
  }
}
