import { OrdersService } from '../../../core/services/orders.service'
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { OrderPlaced } from '../../../model/order_placed.model'; // your refined interface
import { OnInit, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { WritableSignal } from '@angular/core';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogMessageComponent } from '../../shared/dialog-message/dialog-message.component'
import { throwError } from 'rxjs';
import { DataService } from '../../../../app/core/services/data.service'
import { filter, take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent {
  private ordersService = inject(OrdersService);

  constructor(    
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private dataService: DataService
  ) {}

  // Reactive state using signals
  orders: WritableSignal<OrderPlaced[]> = signal<OrderPlaced[]>([] as OrderPlaced[]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Derived state: sorted or filtered if needed
  displayedOrders = computed(() =>
    this.orders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

 
  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      // During prerender/SSR: skip call, use empty/placeholder data
      this.orders.set([]); // or [{ placeholder: true }]
      return;
    }

    // Browser only: safe to call (user may be authenticated)
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ordersService.getOrdersFromExchangeBackend().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.error.set('Failed to load orders. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  // Optional: refresh method (e.g., pull-to-refresh or button)
  refresh(): void {
    this.loadOrders();
  }

  
  openConfirmDialog(order: any): void {
    const dialogData: ConfirmDialogData = {
      title: 'Confirmar',
      message: 'Esta acción es irreversible!'
    };
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {     
      if (result) {        
        this.cancelOrder(order);
      } 
    });
  }


  cancelOrder(order: OrderPlaced): void {
    this.dataService.currentUser
  .pipe(
    // 1. Ensure a user object is emitted (not null)
    filter(user => user !== null),
    // 2. Take only the first emitted user value
    take(1),
    // 3. Switch to the Observable returned by the service call
    switchMap(user => {
      // Check if user is valid and has the required data (e.g., userName)
      if (user && user.userName && order && order.id) {
        
        // Pass the Order object (which holds the ID) and the userName
        // The service method will use this data to construct the URL.
        return this.ordersService.cancelOrder(order, user.userName);
      
      }
      
      // If user or order data is missing, return an observable of an error
      // or simply 'EMPTY' if you want to silently skip the operation.
      // For cancellation, an error is more appropriate. We use throwError from RxJS.
      // NOTE: You must import 'throwError' and 'EMPTY' from 'rxjs'.
      return throwError(() => new Error('Cannot cancel order: Missing user or order details.'));
    })
  )
  .subscribe({
    next: (response) => {
      // Since cancelOrder returns Observable<string>, 'response' will be the string.
      console.log('Order cancelled successfully:', response);
      this.loadOrders();

      // Determine success message (simplified since the service returns a string)
      let successMessage = response || 'Order cancelada exitosamente!';

      // Open success dialog
      this.dialog.open(DialogMessageComponent, {
        width: '400px',
        data: {
          title: 'Success',
          message: successMessage
        }
      });
      // OPTIONAL: Close the current dialog/modal if this logic is within one.
      // this.dialogRef.close(true); 
    },
    error: (err) => {
      // Handle errors from the HTTP call OR the throwError from switchMap
      console.error('Order cancellation failed:', err);
      
      this.dialog.open(DialogMessageComponent, {
        width: '400px',
        data: {
          title: 'Cancellation Failed',
          message: err.message || 'An unexpected error occurred during cancellation.'
        }
      });
    }
  });
  }
}
