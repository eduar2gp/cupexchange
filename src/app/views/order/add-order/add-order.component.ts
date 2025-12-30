import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { OrderTrade } from '../../../model/order_trade.model';
import { TradingPair } from '../../../model/trading_pair'; // <-- Use shared interface

import { DataService } from '../../../core/services/data.service';
import { OrderTradeService } from '../../../core/services/order-trade.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PairSelectionService } from '../../../core/services/pair-selection.service';

import { Subscription } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogMessageComponent } from '../../shared/dialog-message/dialog-message.component'
import { MatDialog } from '@angular/material/dialog';
import { ThemeService } from '../../../../app/core/services/theme-service'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Type {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-add-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
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
  private themeService = inject(ThemeService)

  volumeInput = '';

  constructor(private dialog: MatDialog, private sanitizer: DomSanitizer) {
  }

  // Subscription
  private pairSub!: Subscription;

  // Current selected pair (full object)
  currentPair: TradingPair | null = null;

  newOrder: OrderTrade = {
    username: '',
    pairCode: 'CUPUSD',
    side: 'BUY',
    type: 'MARKET',
    price: 0.0025,
    volume: 0.01,
  };

  types: Type[] = [
    { value: 'LIMIT', viewValue: 'Límite' },
    { value: 'MARKET', viewValue: 'Mercado' },
  ];

  // These will be updated from currentPair
  sliderMin = 4;
  sliderMax = 1000;
  sliderStep = 4;
  minVolume = 0.01;

  ngOnInit(): void {
    if (this.newOrder.volume !== undefined) {
      this.volumeInput = this.newOrder.volume.toFixed(4);
    }

    this.pairSub = this.pairSelectionService.selectedPair$.subscribe(pair => {
      if (pair) {
        this.currentPair = pair;

        // Update order with selected pair code
        this.newOrder.pairCode = pair.value;

        // Update slider and volume constraints directly from the pair object
        if (pair.value == 'USDCUP') {
          this.sliderMin = pair.min ?? 4;
          this.sliderMax = pair.max ?? 1000;
        }
        else {
         this.sliderMin = pair.min ?? 0.0010; //1000 cup x 1 usd         
         this.sliderMax = pair.max ?? 0.0040; // 250 cup x 1 usd
        }
        this.sliderStep = pair.step ?? 4;
        this.minVolume = pair.minVolume ?? 0.01;                
        this.newOrder.volume = pair.minVolume || 0.01;         
        // For MARKET orders or out-of-range price, reset to min
        if (this.newOrder.type === 'MARKET' || this.newOrder.price < this.sliderMin) {
          this.newOrder.price = this.sliderMin;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.pairSub?.unsubscribe();
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.newOrder.side = event.index === 0 ? 'BUY' : 'SELL';
  }

  saveOrder(form: NgForm): void {
    if (form.valid && this.currentPair) {
      this.dataService.currentUser
        .pipe(
          filter(user => user !== null),
          take(1),
          switchMap(user => {
            if (user && user.userId) {
              this.newOrder.username = user.userName;
              return this.orderTradeService.saveOrder(this.newOrder);
            }
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response) {
              console.log('Order saved successfully:', response);

              // Determine success message
              let successMessage = 'Order saved successfully!';
              if (response) {

               successMessage = (response as any)?.message
                  || (response as any)?.msg
                  || (typeof response === 'string' ? response : 'Order saved successfully!');


              } else if (typeof response === 'string') {
                successMessage = response;
              }

              // Open success dialog
              this.dialog.open(DialogMessageComponent, {
                width: '400px',
                data: {
                  title: 'Success',
                  message: successMessage
                }
              });

              // Reset form but keep current pair and side
              form.resetForm({
                pairCode: this.newOrder.pairCode,
                side: this.newOrder.side,
                type: 'MARKET',
                price: this.sliderMin,
                volume: this.minVolume,
              });

              this.walletService.triggerUpdate();
            } else {
              this.dialog.open(DialogMessageComponent, {
                width: '400px',
                data: {
                  title: 'Warning',
                  message: 'Order saved, but no response received from server.'
                }
              });
            }
          },
          error: (err) => {
            console.error('Error saving order:', err);

            let errorMessage = 'Failed to save order. Please try again.';
            if (err?.error && typeof err.error === 'object') {
              errorMessage = err.error.message || err.error.msg || errorMessage;
            } else if (typeof err?.error === 'string') {
              errorMessage = err.error;
            } else if (err?.message) {
              errorMessage = err.message;
            }

            // Open error dialog
            this.dialog.open(DialogMessageComponent, {
              width: '400px',
              data: {
                title: 'Error',
                message: errorMessage
              }
            });
          }
        });
    }
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
      return pair?.substring(0, 3) + "-" + pair?.substring(3, pair.length);
    return '';
  }

  // Called on every input change
  onVolumeInput(value: string) {
    this.volumeInput = value; // keep exactly what user typed
    const parsed = Number(value.replace(/,/g, ''));
    if (!isNaN(parsed)) {
      this.newOrder.volume = parsed; // numeric model
    }
  }

  // Called on blur to format the display
  formatVolumeOnBlur() {
    if (this.newOrder.volume !== null && this.newOrder.volume !== undefined) {
      this.volumeInput = this.newOrder.volume.toFixed(4); // format as string
    }
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
}
