import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../../../core/services/data.service';
import { MerchantOrder } from '../../../model/merchant-order-response.model';
import { MerchantOrdersService } from '../../../core/services/merchant-order.service';

@Component({
  selector: 'app-ecommerce-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './ecommerce-order-detail.html',
  styleUrl: './ecommerce-order-detail.scss',
})
export class EcommerceOrderDetail implements OnInit {
  private readonly dataService = inject(DataService);
  private readonly merchantOrderService = inject(MerchantOrdersService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly order = signal<MerchantOrder | null>(null);
  readonly isPaying = signal(false);
  readonly displayedColumns: string[] = [
    'product',
    'productId',
    'quantity',
    'priceAtPurchase',
    'subtotal',
  ];

  ngOnInit(): void {
    this.order.set(this.dataService.getMerchantOrder());
  }

  backToOrders(): void {
    this.router.navigate(['ecommerce-orders']);
  }

  payOrder(): void {
    const currentOrder = this.order();

    if (!currentOrder || currentOrder.paid || this.isPaying()) {
      return;
    }

    this.isPaying.set(true);

    this.merchantOrderService.payMerchantOrder(currentOrder.merchantOrderId).subscribe({
      next: (response) => {
        const paidOrder = { ...currentOrder, paid: true };
        this.order.set(paidOrder);
        this.dataService.updateMerchantOrder(paidOrder);
        this.snackBar.open(response || 'Order paid successfully.', 'Close', { duration: 3000 });
        this.isPaying.set(false);
      },
      error: (error) => {
        this.snackBar.open(error.error || 'Payment failed. Please try again.', 'Close', {
          duration: 5000,
        });
        this.isPaying.set(false);
      },
    });
  }
}

