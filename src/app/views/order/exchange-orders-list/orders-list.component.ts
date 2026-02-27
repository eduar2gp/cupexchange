import { Component, inject, signal, computed, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Observable, throwError } from 'rxjs';
import { filter, take, switchMap } from 'rxjs/operators';

import { OrdersService } from '../../../core/services/orders.service';
import { Page } from '../../../model/page.model';
import { OrderPlaced } from '../../../model/order_placed.model';
import { DataService } from '../../../../app/core/services/data.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { DialogMessageComponent } from '../../shared/dialog-message/dialog-message.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatPaginatorModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private dialog = inject(MatDialog);
  private dataService = inject(DataService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // --- State Signals ---
  filterStatus = signal<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  orders = signal<OrderPlaced[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // --- Pagination Signals ---
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  // Derived state: Shows orders returned by backend
  // Note: Backend handles sorting by date now
  displayedOrders = computed(() => {
    const currentFilter = this.filterStatus();
    const allOrders = this.orders();

    if (currentFilter === 'ALL') return allOrders;

    return allOrders.filter(o => {
      const isPending = o.status === 'ACTIVE' || o.status === 'PARTLY_FILLED';
      return currentFilter === 'PENDING' ? isPending : !isPending;
    });
  });

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) return;
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ordersService.getOrdersFromExchangeBackend(this.currentPage(), this.pageSize())
      .subscribe({
        next: (page: Page<OrderPlaced>) => {
          this.orders.set(page.content);
          this.totalElements.set(page.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load orders', err);
          this.error.set('Failed to load orders. Please try again later.');
          this.loading.set(false);
        }
      });
  }

  handlePageEvent(e: PageEvent) {
    this.pageSize.set(e.pageSize);
    this.currentPage.set(e.pageIndex);
    this.loadOrders();
  }

  onFilterChange(newFilter: 'ALL' | 'PENDING' | 'COMPLETED') {
    this.filterStatus.set(newFilter);
    // When filtering, usually you want to jump back to the first page
    this.currentPage.set(0);
    this.loadOrders();
  }

  refresh(): void {
    this.loadOrders();
  }

  openConfirmDialog(order: OrderPlaced): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirmar',
      message: 'Esta acción es irreversible!'
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {     
      if (result) this.cancelOrder(order);
    });
  }

  cancelOrder(order: OrderPlaced): void {
    this.dataService.currentUser
      .pipe(
        filter(user => user !== null),
        take(1),
        switchMap(user => {
          if (user?.username && order?.id) {
            return this.ordersService.cancelOrder(order, user.username);
          }
          return throwError(() => new Error('Missing user or order details.'));
        })
      )
      .subscribe({
        next: (response) => {
          this.loadOrders();
          this.dataService.triggerWalletUpdate();
          this.dialog.open(DialogMessageComponent, {
            width: '400px',
            data: { title: 'Success', message: response || 'Order cancelada!' }
          });
        },
        error: (err) => {
          this.dialog.open(DialogMessageComponent, {
            width: '400px',
            data: { title: 'Error', message: err.message }
          });
        }
      });
  }
}