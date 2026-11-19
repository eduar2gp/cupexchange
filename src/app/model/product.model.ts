import { Category } from './category.model';

export interface ProductPrice {
  currencyCode: string;
  price: number;
}

export interface ProductImage {
  id: number | null;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id?: number;
  providerId: number;
  name: string;
  providerName?: string;
  description: string;
  price?: number;
  prices?: ProductPrice[];
  category_id?: number[];
  categories?: Category[];
  stockQuantity: number;
  averageRating?: number;
  reviewCount?: number;
  productImageUrl?: string;
  images?: ProductImage[];
  available?: boolean;
}

export interface ProductReviewResponse {
  content: ProductReview[];
  page: ProductReviewPage;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string;
  userFirstName: string;
  userLastName: string;
  userProfilePicture: string;
  created_at: string;
}

export interface ProductReviewPage {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export function resolveProductPrice(product: Product, currencyCode?: string): number {
  const preferredCurrency = (currencyCode || 'USD').toUpperCase();

  const exactMatch = product.prices?.find(item => item.currencyCode?.toUpperCase() === preferredCurrency);
  if (exactMatch) {
    return exactMatch.price;
  }

  const fallbackPrice = product.prices?.[0]?.price ?? product.price ?? 0;
  return Number(fallbackPrice) || 0;
}
