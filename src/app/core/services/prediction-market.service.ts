import { build, ApiEndpoints } from '../api/endpoints';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PredictionEventList } from '../../model/prediction-event.model';
import { PredictionCategoryList } from '../../model/prediction-category.model';
import { PredictionOrderResponseList } from '../../model/prediction-order-response.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PredictionMarketService {
  constructor(private http: HttpClient) {}

    getPredictionCategories() {
        return this.http.get<PredictionCategoryList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_CATEGORIES));
    }

    getPredictionEvents(categoryId: number) {
      const params = new HttpParams().set('categoryId', categoryId);
      return this.http.get<PredictionEventList>(
        build(ApiEndpoints.predictionMarket.GET_PREDICTION_EVENTS),
        { params }
      );
    }

    getPredictionOrders(eventId: number) {
        return this.http.get<PredictionOrderResponseList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_ORDERS, { eventId }));
    }
    
}