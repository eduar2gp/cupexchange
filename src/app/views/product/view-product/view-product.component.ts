import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProductPrice } from '../../../model/product.model';
import { DataService } from '../../../core/services/data.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-view-product.component',
  imports: [AsyncPipe, DecimalPipe, MatCardModule, MatIconModule],
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss',
})
export class ViewProductComponent {
  readonly product$ = inject(DataService).currentProduct;

  trackPrice(index: number, price: ProductPrice): string {
    return `${price.currencyCode}-${index}`;
  }
}
