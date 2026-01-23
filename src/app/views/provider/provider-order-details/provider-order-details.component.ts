import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { MerchantOrder } from '../../../model/merchant-order-reponse.model';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-provider-order-details',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatDividerModule],
  templateUrl: './provider-order-details.component.html',
  styleUrl: './provider-order-details.component.scss',
})
export class ProviderOrderDetailsComponent implements OnInit {
  private dataService = inject(DataService);

  order: MerchantOrder | null = null;
  displayedColumns: string[] = ['productId', 'quantity', 'priceAtPurchase', 'subtotal'];

  ngOnInit(): void {
    this.order = this.dataService.getMerchantOrder();
  }
}
