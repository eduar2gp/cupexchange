import { build, ApiEndpoints } from '../api/endpoints';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PredictionEventList } from '../../model/prediction-event.model';
import { PredictionCategoryList } from '../../model/prediction-category.model';
import { PredictionOrderResponseList } from '../../model/prediction-order-response.model';
import { HttpParams } from '@angular/common/http';
import { PredictionOrderRequest } from '../../model/prediction-order-request.model';
import { PredictionMarketList } from '../../model/prediction-market.model';
import { Observable } from 'rxjs';

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

    getPredictionMarkets(eventId: number): Observable<PredictionMarketList> {
        return this.http.get<PredictionMarketList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_MARKETS, { eventId }));
    }

    getPredictionOrders(eventId: number) {
        return this.http.get<PredictionOrderResponseList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_ORDERS, { eventId }));
    }

    postPredictionOrder(orderRequest: PredictionOrderRequest) {
        return this.http.post<PredictionOrderResponseList>(build(ApiEndpoints.predictionMarket.POST_PREDICTION_ORDER), orderRequest);
    }
    
}