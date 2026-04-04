export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  createdAt: string;
  seen: boolean;
}