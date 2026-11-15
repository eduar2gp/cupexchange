import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Product, ProductPrice, resolveProductPrice } from '../../../model/product.model';
import { DataService } from '../../../core/services/data.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ViewProductReviewComponent } from '../view-product-review/view-product-review.component';
import { CartService } from '../../../core/services/cart.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-product.component',
  imports: [AsyncPipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, TranslateModule, ViewProductReviewComponent],
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss',
})
export class ViewProductComponent {
  readonly product$ = inject(DataService).currentProduct;
  readonly ratingStars = [1, 2, 3, 4, 5];
  private cartService = inject(CartService);

  trackPrice(index: number, price: ProductPrice): string {
    return `${price.currencyCode}-${index}`;
  }

  private getSelectedProductCurrency(product: Product): string {
    const preferredCurrency = (localStorage.getItem('MERCHANT_PRICE_CURRENCY') || 'USD').toUpperCase();
    const matchedPrice = product.prices?.find(item => item.currencyCode?.toUpperCase() === preferredCurrency);

    return matchedPrice?.currencyCode || product.prices?.[0]?.currencyCode || 'USD';
  }

  addToCart(product: Product): void {
    const defaultCurrency = localStorage.getItem('MERCHANT_PRICE_CURRENCY') || 'USD';
    const currencyCode = this.getSelectedProductCurrency(product);

    this.cartService.addToCart({
      productId: product.id!,
      description: product.description || '',
      name: product.name,
      providerId: product.providerId,
      providerName: product.providerName,
      currencyCode,
      unitPrice: resolveProductPrice(product, defaultCurrency),
      quantity: 1,
      productImgUrl: product.productImageUrl!,
    });
  }
}
