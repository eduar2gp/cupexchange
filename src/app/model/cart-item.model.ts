export interface CartItem {
  productId: number;
  description: string;
  name: string;
  providerId: number;
  providerName?: string;
  currencyCode?: string;
  unitPrice: number;
  quantity: number;
  productImgUrl: string;
}
