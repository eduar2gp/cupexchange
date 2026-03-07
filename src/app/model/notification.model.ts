export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isSeen: boolean;
  createdAt: string;
  seen: boolean;
}