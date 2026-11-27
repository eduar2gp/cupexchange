import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Product, ProductImage, ProductPrice, resolveProductPrice } from '../../../model/product.model';
import { DataService } from '../../../core/services/data.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ViewProductReviewComponent } from '../view-product-review/view-product-review.component';
import { CartService } from '../../../core/services/cart.service';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view-product.component',
  imports: [AsyncPipe, DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, TranslateModule, ViewProductReviewComponent, RouterLink],
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss',
})
export class ViewProductComponent {
  readonly product$ = inject(DataService).currentProduct;
  readonly ratingStars = [1, 2, 3, 4, 5];
  private cartService = inject(CartService);
  activeImageIndex = 0;
  private lastProductId?: number;

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
      productImgUrl: this.getPrimaryImageUrl(product),
    });
  }

  getProductImages(product: Product): ProductImage[] {
    const images = (product.images ?? [])
      .filter(image => !!image.imageUrl)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (images.length > 0) {
      return images;
    }

    if (product.productImageUrl) {
      return [{
        id: null,
        imageUrl: product.productImageUrl,
        altText: null,
        displayOrder: 0,
        isPrimary: true
      }];
    }

    return [];
  }

  getActiveImage(product: Product): ProductImage | null {
    this.syncCarousel(product);
    const images = this.getProductImages(product);
    return images.length > 0 ? images[this.activeImageIndex] : null;
  }

  setActiveImage(product: Product, index: number): void {
    const images = this.getProductImages(product);
    if (images.length === 0) {
      this.activeImageIndex = 0;
      return;
    }
    this.activeImageIndex = Math.max(0, Math.min(index, images.length - 1));
  }

  goToPreviousImage(product: Product): void {
    const images = this.getProductImages(product);
    if (images.length <= 1) {
      return;
    }
    this.activeImageIndex = (this.activeImageIndex - 1 + images.length) % images.length;
  }

  goToNextImage(product: Product): void {
    const images = this.getProductImages(product);
    if (images.length <= 1) {
      return;
    }
    this.activeImageIndex = (this.activeImageIndex + 1) % images.length;
  }

  private syncCarousel(product: Product): void {
    if (this.lastProductId === product.id) {
      const images = this.getProductImages(product);
      if (this.activeImageIndex > images.length - 1) {
        this.activeImageIndex = 0;
      }
      return;
    }

    this.lastProductId = product.id;
    const images = this.getProductImages(product);
    const primaryIndex = images.findIndex(image => image.isPrimary);
    this.activeImageIndex = primaryIndex >= 0 ? primaryIndex : 0;
  }

  private getPrimaryImageUrl(product: Product): string {
    const images = this.getProductImages(product);
    const primaryImage = images.find(image => image.isPrimary);
    return primaryImage?.imageUrl ?? images[0]?.imageUrl ?? product.productImageUrl ?? '';
  }
}
