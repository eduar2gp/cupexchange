import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { UserService } from '../../../core/services/user.service';
import { UserProfileData } from '../../../model/user-profile-data.model';
import { MerchantOrder } from '../../../model/merchant-order-reponse.model';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { signal, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Province } from '../../../model/province.model';
import { Municipality } from '../../../model/muncipality.model';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-provider-order-details',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatDividerModule, MatProgressSpinnerModule, MatIconModule, MatSelectModule],
  templateUrl: './provider-order-details.component.html',
  styleUrl: './provider-order-details.component.scss',
})
export class ProviderOrderDetailsComponent implements OnInit {
  private dataService = inject(DataService);
  private userService = inject(UserService);
  private merchantOrdersService = inject(MerchantOrdersService);
  private snackbar = inject(MatSnackBar);

  // Hold the order in a signal
  order = signal<MerchantOrder | null>(null);

  // Convert the order Signal into an Observable stream
  private order$ = toObservable(this.order);

  // userProfile will update whenever order changes (uses customerId)
  // userProfile will update only when customerId changes (prevents refetch on status-only updates)
  userProfile = toSignal(
    this.order$.pipe(
      map((currentOrder) => currentOrder?.customerId ?? null),
      distinctUntilChanged(),
      switchMap((id) => (id ? this.userService.getUserProfile(id) : of(null)))
    ),
    { initialValue: null }
  );

  // Location lists (same approach as ProfileComponent)
  public provinces: Province[] = [];
  public allMunicipalities: Municipality[] = [];

  displayedColumns: string[] = ['productId', 'quantity', 'priceAtPurchase', 'subtotal'];

  // Status options (matches model: 'pending' | 'process' | 'completed' | 'canceled')
  statuses: { value: MerchantOrder['status']; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'process', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  ngOnInit(): void {
    // Load order synchronously from DataService (same usage as before)
    const orderData = this.dataService.getMerchantOrder();
    this.order.set(orderData);

    // Load provinces/municipalities from localStorage like ProfileComponent
    const provJson = localStorage.getItem('PROVINCES');
    const muniJson = localStorage.getItem('MUNICIPALITIES');

    this.provinces = provJson ? JSON.parse(provJson) : [];
    this.allMunicipalities = muniJson ? JSON.parse(muniJson) : [];
  }

  // Plain getter to make template usage predictable (returns current value)
  get userProfileValue(): UserProfileData | null {
    return this.userProfile();
  }

  // Helper to return province name or a fallback
  getProvinceName(): string {
    const profile = this.userProfile();
    const provinceId = profile?.provinceId;
    if (!provinceId) return '—';
    const p = this.provinces.find(x => x.id === provinceId);
    return p?.name ?? '—';
  }

  // Helper to return municipality name or a fallback
  getMunicipalityName(): string {
    const profile = this.userProfile();
    const muniId = profile?.municipalityId;
    if (!muniId) return '—';
    const m = this.allMunicipalities.find(x => x.id === muniId);
    return m?.name ?? '—';
  }

  // Called when user selects a new status from the mat-select
  onStatusChange(newStatus: MerchantOrder['status']) {
    const current = this.order();
    if (!current || current.status === newStatus) return;

    // Optimistically update UI, then request server update
    const previous = current.status;
    this.order.update(o => (o ? { ...o, status: newStatus } : o));

    this.merchantOrdersService.updateOrderStatus(current.merchantOrderId, newStatus).subscribe({
      next: () => {
        this.snackbar.open("Order Updated Successfully!", "Success", { duration: 3000 });
      },
      error: (err) => {
        // revert on error
        console.error('Failed to update order status', err);
        this.snackbar.open('Failed to update order status' + err, "Error", { duration: 3000 });
        this.order.update(o => (o ? { ...o, status: previous } : o));
      }
    });
  }
}
