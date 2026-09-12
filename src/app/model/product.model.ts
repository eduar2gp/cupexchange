export interface ProductPrice {
  currencyCode: string;
  price: number;
}

export interface Product {
  id?: number;
  providerId: number;
  name: string;
  description: string;
  price?: number;
  prices?: ProductPrice[];
  stockQuantity: number;
  productImageUrl?: string;
  available?: boolean;
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
