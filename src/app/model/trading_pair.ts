export interface TradingPair {
  value: string;        // e.g., "USDCUP" or "CUPUSD"
  viewValue: string;    // Display name, e.g., "USD" or "USD/CUP"
  imageUrl: string;     // Path to currency icon
  min?: number;         // Minimum price (optional, from backend)
  max?: number;         // Maximum price (optional)
  step?: number;        // Price step/increment (optional)
  minVolume?: number;   // Minimum order volume (critical for validation)
}
