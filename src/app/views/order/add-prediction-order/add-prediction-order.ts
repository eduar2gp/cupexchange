import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { PredictionOrderRequest } from '../../../model/prediction-order-request.model';
import { DataService } from '../../../core/services/data.service';
import { User } from '../../../model/user.model';
import { Wallet } from '../../../model/wallet.model';
import { PredictionMarketResponse } from '../../../model/prediction-market.model';

@Component({
  selector: 'app-add-prediction-order',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-prediction-order.html',
  styleUrl: './add-prediction-order.scss',
})
export class AddPredictionOrder implements OnInit {
  private currentUser: User | null = null;
  private readonly dataService = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly predictionMarketService = inject(PredictionMarketService);
  readonly predictionMarketStatus: PredictionMarketResponse | null = this.dataService.getPredictionMarketStatus();
  wallets: Wallet[] = [];
  selectedWallet: Wallet | null = null;
  merchantPriceCurrency = 'USD';
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  order: PredictionOrderRequest = {
    appUserId: 0,
    walletId: 0,
    marketId: 0,
    side: 'SELL',
    outcomePosition: 'YES',
    price: 50,
    quantity: 100,
  };

  ngOnInit(): void {
    const marketId = Number(this.route.snapshot.paramMap.get('marketId'));
    if (Number.isInteger(marketId) && marketId > 0) {
      this.order.marketId = marketId;
    } else {
      this.errorMessage = 'A valid market is required to place an order.';
    }

    this.loadWallets();
    this.dataService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.order.appUserId = user?.id ?? 0;
    });

    
  }

  submitOrder(form: NgForm): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (form.invalid || !this.order.marketId || !this.order.appUserId || !this.order.walletId) {
      if(!this.order.appUserId){
        this.errorMessage = 'User information is missing. Please log in again.';
        return;
      }
      else {
        this.errorMessage = 'Complete all required fields before submitting the order.';
        return;
      }
    }

    if (!Number.isInteger(this.order.price) || this.order.price < 1 || this.order.price > 99) {
      this.errorMessage = 'Price must be a whole number between 1 and 99.';
      return;
    }

    const payload: PredictionOrderRequest = {
      ...this.order,
      appUserId: this.currentUser!.id,
      walletId: Number(this.order.walletId),
      marketId: Number(this.order.marketId),
      price: Number(this.order.price/100),
      quantity: Number(this.order.quantity),
    };

    this.isSubmitting = true;
    this.predictionMarketService.postPredictionOrder(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Prediction order placed successfully.';
        this.router.navigate(['/prediction-market-dashboard']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error?.error?.message ?? error?.error ?? 'Unable to place the prediction order.';
        console.error('Failed to place prediction order', error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/prediction-market-dashboard']);
  }

  get maximumPay(): number {
    return Number(this.order.quantity) || 0;
  }

  get baseCost(): number {
    return ((Number(this.order.price) || 0) / 100) * this.maximumPay;
  }

  get commissionCost(): number {
    return this.baseCost * 0.01;
  }

  get orderCost(): number {
    return this.baseCost + this.commissionCost;
  }

  get profit(): number {
    return this.maximumPay - this.orderCost;
  }

  private loadWallets(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const storedWallets = localStorage.getItem('WALLETS');
      this.wallets = storedWallets ? (JSON.parse(storedWallets) as Wallet[]) : [];
      this.merchantPriceCurrency = localStorage.getItem('MERCHANT_PRICE_CURRENCY') || 'USD';
      const wallet = this.wallets.find(
        (item) => item.currencyCode?.toUpperCase() === this.merchantPriceCurrency.toUpperCase(),
      );
      const walletId = Number(wallet?.walletId);

      if (Number.isInteger(walletId) && walletId > 0) {
        this.selectedWallet = wallet ?? null;
        this.order.walletId = walletId;
      } else {
        this.selectedWallet = null;
        this.errorMessage = `No ${this.merchantPriceCurrency} wallet is available. Create or load one before placing an order.`;
      }
    } catch (error) {
      this.wallets = [];
      this.errorMessage = 'Saved wallet data is invalid. Please refresh your wallets and try again.';
      console.error('Failed to read wallets from local storage', error);
    }
  }
}
