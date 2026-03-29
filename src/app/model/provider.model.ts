export interface Provider {
  id?: number;
  name: string;
  email: string;
  phone: string;
  userId: number;
  profileImageUrl?: string;
  cashProvider?: boolean;
  address?: string;
}
