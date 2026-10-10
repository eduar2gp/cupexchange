import { build, ApiEndpoints } from '../api/endpoints';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PredictionEventList } from '../../model/prediction-event.model';
import { PredictionCategoryList } from '../../model/prediction-category.model';
import { PredictionOrderResponseList } from '../../model/prediction-order-response.model';
import { HttpParams } from '@angular/common/http';
import { PredictionOrderRequest } from '../../model/prediction-order-request.model';
import { PredictionMarketList } from '../../model/prediction-market.model';
import { Observable, shareReplay, tap } from 'rxjs';
import { PredictionPosition } from '../../model/prediction-position.model';
import { PredictionMarketOdds } from '../../model/prediction-market-odds.model';

@Injectable({
  providedIn: 'root'
})
export class PredictionMarketService {
  private readonly positionsRequests = new Map<number, Observable<PredictionPosition[]>>();

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

    getPredictionOrdersByEventId(eventId: number) {
        return this.http.get<PredictionOrderResponseList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_ORDERS_BY_EVENT_ID, { eventId }));
    }

    getPredictionOrdersByUserId() {
        return this.http.get<PredictionOrderResponseList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_ORDERS_BY_USER_ID));
    }

    postPredictionOrder(orderRequest: PredictionOrderRequest) {
      return this.http.post<PredictionOrderResponseList>(build(ApiEndpoints.predictionMarket.POST_PREDICTION_ORDER), orderRequest).pipe(
        tap(() => this.positionsRequests.delete(orderRequest.marketId)),
      );
    }

    getPredictionPositions(predictionMarketId: number): Observable<PredictionPosition[]> {
      const cachedRequest = this.positionsRequests.get(predictionMarketId);
      if (cachedRequest) {
        return cachedRequest;
      }

      const request = this.http
        .get<PredictionPosition[]>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_POSITIONS, { predictionMarketId }))
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.positionsRequests.set(predictionMarketId, request);

      return request;
    }

    getPredictionMarketOdds(predictionMarketId: number): Observable<PredictionMarketOdds> {
        return this.http.get<PredictionMarketOdds>(build(ApiEndpoints.predictionMarket.GET_MARKET_ODDS, { predictionMarketId }));
    }
    
}