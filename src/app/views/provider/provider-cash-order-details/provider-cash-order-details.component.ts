import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map, distinctUntilChanged, switchMap } from 'rxjs/operators';

// Material & UI
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

// Services & Models
import { DataService } from '../../../core/services/data.service';
import { UserService } from '../../../core/services/user.service';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { CashOrder } from '../../../model/cash-order-response.model';
import { UserProfileData } from '../../../model/user-profile-data.model';
import { Province } from '../../../model/province.model';
import { Municipality } from '../../../model/muncipality.model';

@Component({
  selector: 'app-provider-cash-order-details',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatCardModule, 
    MatDividerModule, 
    MatProgressSpinnerModule, 
    MatIconModule, 
    MatSelectModule
  ],
  templateUrl: './provider-cash-order-details.component.html',
  styleUrl: './provider-cash-order-details.component.scss',
})
export class ProviderCashOrderDetailsComponent implements OnInit {
  private dataService = inject(DataService);
  private userService = inject(UserService);
  private merchantOrdersService = inject(MerchantOrdersService);
  private snackbar = inject(MatSnackBar);

  // 1. Core Data Signals
  cashOrder = signal<CashOrder | null>(null);
  private order$ = toObservable(this.cashOrder);

  // 2. Location Data (Loaded from localStorage)
  public provinces: Province[] = [];
  public allMunicipalities: Municipality[] = [];

  // 3. Reactive User Profile Fetch
  // This triggers automatically when cashOrder.user.id changes
  userProfile = toSignal(
    this.order$.pipe(
      map((order) => order?.user?.id ?? null),
      distinctUntilChanged(),
      switchMap((id) => (id ? this.userService.getUserProfile(id) : of(null)))
    ),
    { initialValue: null }
  );

  statuses: { value: CashOrder['status']; label: string }[] = [
    { value: 'COMPLETED', label: 'Completada' },
    { value: 'REJECTED', label: 'Rechazada' },
  ];

  ngOnInit(): void {
    // Initialize order from DataService
    const orderData = this.dataService.getCashOrder();
    this.cashOrder.set(orderData);

    // Load Preferences JSON from localStorage
    const provJson = localStorage.getItem('PROVINCES');
    const muniJson = localStorage.getItem('MUNICIPALITIES');

    this.provinces = provJson ? JSON.parse(provJson) : [];
    this.allMunicipalities = muniJson ? JSON.parse(muniJson) : [];
  }

  // --- Location Helpers ---

  getProvinceName(): string {
    const profile = this.userProfile();
    if (!profile?.provinceId) return '—';
    return this.provinces.find(p => p.id === profile.provinceId)?.name ?? '—';
  }

  getMunicipalityName(): string {
    const profile = this.userProfile();
    if (!profile?.municipalityId) return '—';
    return this.allMunicipalities.find(m => m.id === profile.municipalityId)?.name ?? '—';
  }

  // --- Actions ---

  onStatusChange(newStatus: string) {
    const current = this.cashOrder();
    if (!current || current.status === newStatus) return;

    const previousStatus = current.status;
    
    // Optimistic Update
    this.cashOrder.update(o => (o ? { ...o, status: newStatus } : o));

    this.merchantOrdersService.updateCashOrderStatus(current.orderId, newStatus).subscribe({
      next: () => {
        this.snackbar.open("Order status updated!", "Close", { duration: 3000 });
      },
      error: (err) => {
        this.snackbar.open(err.error, "Error", { duration: 3000 });
        // Rollback
        this.cashOrder.update(o => (o ? { ...o, status: previousStatus } : o));
      }
    });
  }

  get userProfileValue(): UserProfileData | null {
    return this.userProfile();
  }
}