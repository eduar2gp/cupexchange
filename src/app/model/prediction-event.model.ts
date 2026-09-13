export type EventStatus = 'SCHEDULED' | 'ACTIVE' | 'SETTLED' | 'CANCELLED';

export interface PredictionEventResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  startTime: string | null; // ISO 8601 string representation or null
  endTime: string | null;   // ISO 8601 string representation or null
  status: EventStatus;
}

// Type alias for array responses
export type PredictionEventList = PredictionEventResponse[];