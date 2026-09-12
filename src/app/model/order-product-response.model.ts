export interface OrderProductResponse {
  productId: number;
  quantity: number;
  priceAtPurchase: number;
  currencyCode?: string;
  product: {
    id: number;
    name: string;
    productImageUrl: string;
  };
}