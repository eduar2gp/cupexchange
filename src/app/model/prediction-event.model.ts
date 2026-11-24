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

export interface PredictionEventCreateRequestDto {
  categoryId: number;
  title: string;
  startTime: string; // ISO-8601 datetime, e.g. "2026-11-23T16:00:00Z"
  endTime: string;   // ISO-8601 datetime
  status?: EventStatus;
}

// Type alias for array responses
export type PredictionEventList = PredictionEventResponse[];