export interface OrderProductResponse {
  productId: number;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: number;
    name: string;
    productImageUrl: string;
  };
}