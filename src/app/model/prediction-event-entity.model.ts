export interface PredictionEventEntityRequestDto {
    eventId: number;
    entityId: number;
    role?: string;
}

export interface PredictionEventEntityResponseDto {
    eventId: number;
    eventTitle: string;
    entityId: number;
    entityName: string;
    role: string;
}