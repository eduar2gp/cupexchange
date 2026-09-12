export interface CartItem {
  productId: number;
  name: string;
  providerId: number;
  currencyCode?: string;
  unitPrice: number;
  quantity: number;
  productImgUrl: string;
}
