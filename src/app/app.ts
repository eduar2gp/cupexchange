import { Component, signal, inject, ViewChild, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../app/core/services/auth.service';
import { PairSelectionService } from '../app/core/services/pair-selection.service';
import { ThemeService } from '../app/core/services/theme-service';
//import { OrdersService } from '../app/core/services/orders.service';
//import { Fcm } from '../app/core/services/fcm.service';

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

import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, filter } from 'rxjs';
import { TradingPair } from './model/trading_pair';
import { Order } from './model/order.model';
import { Inject, PLATFORM_ID } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment'
import { LanguageService } from '../app/core/services/language.service'
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  protected readonly title = signal('');

 //  Services
  public authService = inject(AuthService);
  private router = inject(Router);
  private pairSelectionService = inject(PairSelectionService);
  public themeService = inject(ThemeService);
 // private ordersService = inject(OrdersService);
 // private fcmService = inject(Fcm);
  private http = inject(HttpClient);
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

  orderCount$!: Observable<number>;


  constructor(private languageService: LanguageService) {

  }

  ngOnInit(): void {
    this.themeService.initTheme();



    // 2. CRITICAL FIX: Only run browser-specific setup on the client
    if (isPlatformBrowser(this.platformId)) {

     //  1. Load pairs from backend (The HTTP request that must complete)
     this.loadTradingPairs();

    //   FCM token request setup (Promise execution must be client-side)
   //   this.fcmService.requestPermissionAndGetToken().then(token => {
      //  if (token) {
        //  console.log('FCM Token obtained:', token);
      //  }
    //  });

     //  CRITICAL: Non-terminating stream subscription must be client-side
      //this.fcmSubscription = this.fcmService.receiveMessages().subscribe(payload => {
      //  console.log('Foreground message received:', payload);
     // });
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
    //this.fcmSubscription?.unsubscribe();  //Dispose of the client-side FCM subscription
  }

  private loadTradingPairs(): void {
    this.http.get<TradingPair[]>(`${environment.baseApiUrl}/api/v1/trade/currencies/pairs`).subscribe({
      next: (pairsFromApi) => {
        if (pairsFromApi && pairsFromApi.length > 0) {
          this.availablePairs = pairsFromApi;
        } else {
          this.availablePairs = this.DEFAULT_PAIRS;
        }
        this.initializeSelectedPair();
      },
      error: (err) => {
        console.warn('Failed to load pairs from API, using defaults:', err);
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

   //  If no saved or not found, use first available
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
    console.log('pair selection ' + selected)

    if (!selected || selected.value === this.selectedPair?.value) {
      return;
    }

    this.selectedPair = selected;
    localStorage.setItem(this.STORAGE_KEY, selected.value);
    console.log('setting selection ' + selected)
    this.pairSelectionService.setSelectedPair(selected);
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  get isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  formatPairDisplay(pair: string | undefined): string {
    if (pair)
      return pair?.substring(0, 3) + " - " + pair?.substring(3, pair.length);
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
}


