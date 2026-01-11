import { Component, signal, inject, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../app/core/services/auth.service';
import { PairSelectionService } from '../app/core/services/pair-selection.service';
import { ThemeService } from '../app/core/services/theme-service';


import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

import { Subscription, filter } from 'rxjs';
import { TradingPair } from './model/trading_pair';

import { PLATFORM_ID } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { WalletService } from '../app/core/services/wallet.service'
import { LanguageService } from '../app/core/services/language.service'
import { NavigationDecisionService } from '../app/core/services/navigation-decision.service'
import { Role } from '../app/model/roles.enum'
import { HasRoleDirective } from '../app/core/directives/has-roles.directive'
import { FCMService } from '../app/core/services/fcm.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatBadgeModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatSlideToggleModule,
    TranslateModule,
    HasRoleDirective
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  protected readonly title = signal('');
  public readonly Role = Role;

 //  Services
  public authService = inject(AuthService);
  private router = inject(Router);
  private pairSelectionService = inject(PairSelectionService);
  public themeService = inject(ThemeService);
  private walletService = inject(WalletService);
  private navigationDecisionService = inject(NavigationDecisionService);
  private platformId = inject(PLATFORM_ID);

   //Subscriptions
  private routerSubscription?: Subscription;
  private fcmSubscription?: Subscription;

 // Trading pairs
  availablePairs: TradingPair[] = [];
  selectedPair: TradingPair | null = null;

  private readonly STORAGE_KEY = 'preferredTradingPairCode';

  // Default fallback pairs (in case API fails or not loaded yet)
  private readonly DEFAULT_PAIRS: TradingPair[] = [
    { value: 'USDCUP', viewValue: 'USD-CUP (Dólar)', imageUrl: 'assets/currencies/usd.png', min: 4, max: 1000, step: 4, minVolume: 0.01 }
  ];

  //orderCount$!: Observable<number>;
  constructor(
    private languageService: LanguageService,
    private fcmService: FCMService
  ) { }

  ngOnInit(): void {
    this.themeService.initTheme();
    // 2. CRITICAL FIX: Only run browser-specific setup on the client
    if (isPlatformBrowser(this.platformId)) {
      //  1. Load pairs from backend (The HTTP request that must complete)
      this.loadTradingPairs();
      if (localStorage.getItem('NOTIFICATIONS_ENABLED') === 'true') {
        this.fcmSubscription = this.fcmService.receiveMessages().subscribe(payload => {
          console.log('Foreground message handled by component:', payload);
        });
      }
    }
    // Order count badge (Uncomment and ensure OrdersService is SSR-safe)
    //this.orderCount$ = this.ordersService.getCurrentUserOrders().pipe(
     // map(orders => orders.length)
    //);
  }

  ngAfterViewInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.sidenav?.close());
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();   
    if (this.fcmSubscription) {
      this.fcmSubscription.unsubscribe(); // Still critical to unsubscribe from the Subject
    }
  }

  private loadTradingPairs(): void {
    this.walletService.getCurrenciesPairs().subscribe({
      next: (pairsFromApi: TradingPair[]) => {
        if (pairsFromApi && pairsFromApi.length > 0) {
          this.availablePairs = pairsFromApi;
          localStorage.setItem('CURRENCIES_PAIRS', JSON.stringify(pairsFromApi));
        } else {
          this.availablePairs = this.DEFAULT_PAIRS;
        }
        this.initializeSelectedPair();
      },
      error: (err) => {
        console.warn('Failed to load pairs from wallet service, using defaults:', err);
        this.availablePairs = this.DEFAULT_PAIRS;
        this.initializeSelectedPair();
      }
    });
  }

  private initializeSelectedPair(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedCode = localStorage.getItem(this.STORAGE_KEY);
    let pairToSelect: TradingPair | undefined;

    if (savedCode) {
      pairToSelect = this.availablePairs.find(p => p.value === savedCode);
    }

    if (!pairToSelect) {
      pairToSelect = this.availablePairs[0];
    }

    this.selectedPair = pairToSelect || null;

    if (this.selectedPair) {
      this.pairSelectionService.setSelectedPair(this.selectedPair);
    }
  }

  onPairSelect(selected: TradingPair): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!selected || selected.value === this.selectedPair?.value) {
      return;
    }
    this.selectedPair = selected;
    localStorage.setItem(this.STORAGE_KEY, selected.value);
    this.pairSelectionService.setSelectedPair(selected);
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  formatPairDisplay(pair: string | undefined): string {
    if (pair)
      return pair?.substring(0, 3) + "-" + pair?.substring(3, pair.length);
    return '';
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

  checkWalletsAndNavigate() {
    this.sidenav.close(); 
    const walletsExist = this.navigationDecisionService
      .verifyWallets(this.pairSelectionService.getCurrentPair()?.value);
    if (walletsExist) {
      this.router.navigate(['/add-order']);
    } else {
      this.router.navigate(['/add-wallet']); 
    }
  }
}
