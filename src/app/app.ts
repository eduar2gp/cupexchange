import { Component, signal, inject, ViewChild, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';

import { Subscription, filter } from 'rxjs';
import { TradingPair } from './model/trading_pair';

import { PLATFORM_ID } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { WalletService } from '../app/core/services/wallet.service'
import { LanguageService } from '../app/core/services/language.service'
import { NavigationDecisionService } from '../app/core/services/navigation-decision.service'
import { Role } from '../app/model/roles.enum'
import { HasRoleDirective } from '../app/core/directives/has-roles.directive'
import { FCMService } from '../app/core/services/fcm.service';
import { DataService } from '../app/core/services/data.service'
import { SearchService } from '../app/core/services/search.service'
import { CartService } from '../app/core/services/cart.service'
import { LocationService } from '../app/core/services/location.service'
import { Province } from './model/province.model';
import { Municipality } from './model/muncipality.model';
import { RouterLinkActive } from '@angular/router';
import { startWith } from 'rxjs/operators';
import { NotificationService } from './core/services/notification.service';
import { FeatureFlagDirective } from '../app/core/directives/feature-flag.directive'
import { GeocubaService } from '../app/core/services/geocuba.service';
import { GeoCuba } from './model/geo-cuba.model';
import { User } from './model/user.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogMessageComponent } from './views/shared/dialog-message/dialog-message.component';

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
    HasRoleDirective,
    FeatureFlagDirective,
    MatInputModule,
    RouterLinkActive
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
  public cartService = inject(CartService);
  public locationService = inject(LocationService);
  public dataService = inject(DataService)
  public notificationService = inject(NotificationService)
  private geocubaService: GeocubaService = inject(GeocubaService);
  private dialog = inject(MatDialog);
  private translateService = inject(TranslateService);
  private ngZone = inject(NgZone);

  //Subscriptions
  private routerSubscription?: Subscription;
  private fcmSubscription?: Subscription;

  // Trading pairs
  availablePairs: TradingPair[] = [];

  private readonly STORAGE_KEY = 'preferredTradingPairCode';
  private readonly USER_PROFILE_STORAGE_KEY = 'USER_PROFILE_DATA';
  private readonly GEO_DIALOG_SESSION_KEY = 'geo_dialog_last_seen_location';
  private readonly GEO_CUBA_STORAGE_KEY = 'GEO_CUBA_DATA';

  // Default fallback pairs (in case API fails or not loaded yet)
  private readonly DEFAULT_PAIRS: TradingPair[] = [
    { value: 'USDCUP', viewValue: 'USD-CUP (Dólar)', imageUrl: 'assets/currencies/usd.png', min: 4, max: 1000, step: 4, minVolume: 0.01 }
  ];

  isEcommerce = () => this.router.url.includes('ecommerce');

  cartCount$ = this.cartService.cartCount$.pipe(startWith(0));

  selectedPair: TradingPair | null = this.DEFAULT_PAIRS[0];
  public readonly latitude = signal<number | null>(null);
  public readonly longitude = signal<number | null>(null);
  public readonly errorMessage = signal<string | null>(null);
  public readonly isLoading = signal<boolean>(false);

  // Add this to your class properties
  notificationCount$ = this.notificationService.unreadNotificationsCount$;

  //orderCount$!: Observable<number>;
  constructor(
    private languageService: LanguageService,
    private fcmService: FCMService,
    public searchService: SearchService
  ) {

  }

  ngOnInit(): void {
    this.themeService.initTheme();
    // 2. CRITICAL FIX: Only run browser-specific setup on the client
    if (isPlatformBrowser(this.platformId)) {
      this.requestLocation();
      //  1. Load pairs from backend (The HTTP request that must complete)
      this.loadTradingPairs();
      this.loadProvinces();
      this.loadMunicipalities();
      if (localStorage.getItem('NOTIFICATIONS_ENABLED') === 'true') {
        this.fcmSubscription = this.fcmService.receiveMessages().subscribe(payload => {
          console.log('Foreground message received in UI layer');
        });
      }
    }
    // Order count badge (Uncomment and ensure OrdersService is SSR-safe)
    //this.orderCount$ = this.ordersService.getCurrentUserOrders().pipe(
    // map(orders => orders.length)
    //);
  }
  
  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.sidenav?.close());

    if (!localStorage.getItem('tutorial_seen')) {
      setTimeout(async () => {
        const introJs = (await import('intro.js')).default;

        const intro = introJs().setOptions({
          // 1. Disable the built-in auto-scroll to prevent conflict
          scrollToElement: false,
          // 2. Optional: Ensure the helper layer doesn't clip on small screens
          positionPrecedence: ['bottom', 'top', 'right', 'left']
        });

        intro.onbeforechange(async (targetElement: HTMLElement) => {
          if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            // Option 2.1: If using 'smooth' scroll, wait a tiny bit for the 
            // scroll to start before letting Intro.js position the tooltip.
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          return true; // <--- This satisfies the 'introBeforeChangeCallback' type
        });

        // 4. Force a refresh after a small delay to catch the final position
        intro.onafterchange(() => {
          setTimeout(() => intro.refresh(), 100);
        });

        intro.start();
        localStorage.setItem('tutorial_seen', 'true');
      }, 600);
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    if (this.fcmSubscription) {
      this.fcmSubscription.unsubscribe(); // Still critical to unsubscribe from the Subject
    }
  }

  requestLocation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.errorMessage.set('Location access is only available in the browser.');
      return;
    }

    if (!('geolocation' in navigator)) {
      this.errorMessage.set('Geolocation is not supported by your browser.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        this.ngZone.run(() => {
          this.latitude.set(position.coords.latitude);
          this.longitude.set(position.coords.longitude);
          this.isLoading.set(false);
          this.errorMessage.set(null);
          this.geocubaService.getProvinceAndMunicipality(position.coords.latitude, position.coords.longitude).subscribe({
            next: (response: GeoCuba) => {
              const geoCuba = this.parseGeoCubaResponse(response);
              if (!geoCuba) {
                return;
              }

              if (geoCuba.provinceId != null && geoCuba.municipalityId != null) {
                this.persistGeoIntoStoredUser(geoCuba);
              }
            },
            error: (err: unknown) => {
              console.error('Failed to get GeoCuba data:', err);
            }
          });
        });
      },
      (error: GeolocationPositionError) => {
        this.ngZone.run(() => {
          this.isLoading.set(false);
          this.handleLocationError(error);
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  private handleLocationError(error: GeolocationPositionError): void {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.errorMessage.set('Location permission denied. Please enable it in your browser settings.');
        break;
      case error.POSITION_UNAVAILABLE:
        this.errorMessage.set('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        this.errorMessage.set('The request to get user location timed out.');
        break;
      default:
        this.errorMessage.set('An unknown error occurred while getting your location.');
        break;
    }
    console.error(`Geolocation error (${error.code}): ${error.message}`);
  }

  private parseGeoCubaResponse(response: Partial<GeoCuba> | null | undefined): GeoCuba | null {
    if (!response) {
      return null;
    }

    const provinceId = this.toValidNumber(response.provinceId);
    const municipalityId = this.toValidNumber(response.municipalityId);

    if (provinceId === null || municipalityId === null) {
      return null;
    }

    return {
      provinceId,
      municipalityId,
      province: response.province ?? '',
      municipality: response.municipality ?? '',
    };
  }

  private toValidNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private persistGeoIntoStoredUser(geoCuba: GeoCuba): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.GEO_CUBA_STORAGE_KEY, JSON.stringify(geoCuba));

    try {
      const savedProfileJson = localStorage.getItem(this.USER_PROFILE_STORAGE_KEY);
      const currentUserFromState = this.dataService.getCurrentUserValue();

      if (savedProfileJson) {
        const currentUser = JSON.parse(savedProfileJson) as User;
        const updatedUser: User = {
          ...currentUser,
          provinceId: geoCuba.provinceId,
          municipalityId: geoCuba.municipalityId,
        };

        localStorage.setItem(this.USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedUser));
        this.dataService.updateUser(updatedUser);
      } else if (currentUserFromState) {
        const updatedUserFromState: User = {
          ...currentUserFromState,
          provinceId: geoCuba.provinceId,
          municipalityId: geoCuba.municipalityId,
        };
        localStorage.setItem(this.USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedUserFromState));
        this.dataService.updateUser(updatedUserFromState);
      }

      if (this.shouldShowLocationDialog(geoCuba)) {
        this.showDefaultLocationDialog(geoCuba);
        this.markLocationDialogAsShown(geoCuba);
      }
    } catch (error) {
      console.error('Failed to persist geolocation data in localStorage:', error);
    }
  }

  private shouldShowLocationDialog(geoCuba: GeoCuba): boolean {
    const locationFingerprint = `${geoCuba.provinceId}:${geoCuba.municipalityId}`;

    try {
      const sessionValue = sessionStorage.getItem(this.GEO_DIALOG_SESSION_KEY);
      const localValue = localStorage.getItem(this.GEO_DIALOG_SESSION_KEY);
      return sessionValue !== locationFingerprint && localValue !== locationFingerprint;
    } catch {
      return true;
    }
  }

  private markLocationDialogAsShown(geoCuba: GeoCuba): void {
    const locationFingerprint = `${geoCuba.provinceId}:${geoCuba.municipalityId}`;

    try {
      sessionStorage.setItem(this.GEO_DIALOG_SESSION_KEY, locationFingerprint);
      localStorage.setItem(this.GEO_DIALOG_SESSION_KEY, locationFingerprint);
    } catch (error) {
      console.warn('Could not persist geolocation dialog flag:', error);
    }
  }

  private showDefaultLocationDialog(geoCuba: GeoCuba): void {
    const title = this.translateService.instant('GEOLOCATION_DIALOG_TITLE');
    const prefix = this.translateService.instant('GEOLOCATION_DEFAULT_LOCATION_SET_TO');
    const goProfile = this.translateService.instant('GEOLOCATION_CHANGE_IN_PROFILE');
    const provinceLabel = geoCuba.province?.trim() || `Province ${geoCuba.provinceId}`;
    const municipalityLabel = geoCuba.municipality?.trim() || `Municipality ${geoCuba.municipalityId}`;
    const locationLabel = `${provinceLabel}, ${municipalityLabel}`;

    this.dialog.open(DialogMessageComponent, {
      data: {
        title,
        message: `${prefix} ${locationLabel}. ${goProfile}`,
      },
    });
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

  private loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: (provinces: Province[]) => {
        localStorage.setItem('PROVINCES', JSON.stringify(provinces));
      }
    })
  }
  private loadMunicipalities(): void {
    this.locationService.getMunicipalities().subscribe({
      next: (municipalities: Municipality[]) => {
        localStorage.setItem('MUNICIPALITIES', JSON.stringify(municipalities));
      }
    })
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
    this.router.navigate(['/login']);
    this.notificationService.unreadNotificationsSubject.next(0);
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
    return `assets/currencies/${baseCurrency}_currency.png`;
  }

  getQuoteCurrencyImage(pair: string | undefined): string {
    if (!pair || pair.length < 6) {
      return 'assets/currencies/default.png';
    }
    const quoteCurrency = pair.substring(3, pair.length).toLowerCase();
    return `assets/currencies/${quoteCurrency}_currency.png`;
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

  onSearchChange(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchService.updateSearch(filterValue);
  }
}
