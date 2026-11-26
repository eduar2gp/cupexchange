import { build, ApiEndpoints } from '../api/endpoints';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PredictionEventList, PredictionEventCreateRequestDto, PredictionEventResponse } from '../../model/prediction-event.model';
import { PredictionCategoryList } from '../../model/prediction-category.model';
import { PredictionOrderResponseList } from '../../model/prediction-order-response.model';
import { HttpParams } from '@angular/common/http';
import { PredictionOrderRequest } from '../../model/prediction-order-request.model';
import { PredictionMarketList } from '../../model/prediction-market.model';
import { Observable, shareReplay, tap } from 'rxjs';
import { PredictionPosition } from '../../model/prediction-position.model';
import { PredictionMarketOdds } from '../../model/prediction-market-odds.model';
import { PredictionEntity } from '../../model/prediction-entity.model';
import { PredictionMarketRequest, PredictionMarketResponse } from '../../model/prediction-market.model';
import { PredictionEventEntityRequestDto, PredictionEventEntityResponseDto } from '../../model/prediction-event-entity.model';

@Injectable({
  providedIn: 'root'
})
export class PredictionMarketService {
  private readonly positionsRequests = new Map<number, Observable<PredictionPosition[]>>();
  private categoriesRequest$: Observable<PredictionCategoryList> | null = null;

  constructor(private http: HttpClient) { }

  getPredictionCategories(forceRefresh: boolean = false): Observable<PredictionCategoryList> {
    if (forceRefresh || !this.categoriesRequest$) {
      this.categoriesRequest$ = this.http
        .get<PredictionCategoryList>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_CATEGORIES))
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }

    return this.categoriesRequest$;
  }

  getPredictionEvents(categoryId: number) {
    const params = new HttpParams()
      .set('categoryId', categoryId)
      .set('status', 'SCHEDULED');

    return this.http.get<PredictionEventList>(
      build(ApiEndpoints.predictionMarket.GET_PREDICTION_EVENTS),
      { params }
    );
  }

  getPredictionMarkets(eventId: number, currencyCode: string): Observable<PredictionMarketList> {
    return this.http.get<PredictionMarketList>(
      build(ApiEndpoints.predictionMarket.GET_PREDICTION_MARKETS, { eventId, currencyCode }));
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

  postPredictionEntity(predictionEntity: PredictionEntity): Observable<PredictionEntity> {
    return this.http.post<PredictionEntity>(
      build(ApiEndpoints.predictionMarket.POST_PREDICTION_ENTITY),
      predictionEntity,
    );
  }

  postPredictionEvent(predictionEvent: PredictionEventCreateRequestDto): Observable<PredictionEventResponse> {
    return this.http.post<PredictionEventResponse>(
      build(ApiEndpoints.predictionMarket.POST_PREDICTION_EVENT),
      predictionEvent,
    );
  }

  getSearchPredictionEvents(categoryId: number, title: string, status: string): Observable<PredictionEventList> {
    let params = new HttpParams().set('categoryId', categoryId.toString());
    const normalizedTitle = title?.trim();
    const normalizedStatus = status?.trim();

    if (normalizedTitle) {
      params = params.set('title', normalizedTitle);
    }

    if (normalizedStatus) {
      params = params.set('status', normalizedStatus);
    }

    return this.http.get<PredictionEventList>(
      build(ApiEndpoints.predictionMarket.GET_SEARCH_PREDICTION_EVENTS),
      { params }
    );
  }

  postPredictionMarket(marketRequest: PredictionMarketRequest): Observable<PredictionMarketResponse> {
    return this.http.post<PredictionMarketResponse>(
      build(ApiEndpoints.predictionMarket.POST_PREDICTION_MARKET),
      marketRequest
    );
  }

  postPredictionEventEntity(eventEntityRequest: PredictionEventEntityRequestDto): Observable<PredictionEventEntityResponseDto> {
    return this.http.post<PredictionEventEntityResponseDto>(
      build(ApiEndpoints.predictionMarket.POST_PREDICTION_EVENT_ENTITY),
      eventEntityRequest
    );
  }

  getPredictionEntities(name: string, entityType?: 'TEAM' | 'PLAYER'): Observable<PredictionEntity[]> {
    let params = new HttpParams().set('name', name);
    if (entityType) {
      params = params.set('entityType', entityType);
    }
    return this.http.get<PredictionEntity[]>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_ENTITIES), { params });
  }

  getPredictionEventEntities(eventId: number): Observable<PredictionEventEntityResponseDto[]> {
    const params = new HttpParams().set('eventId', eventId.toString());
    return this.http.get<PredictionEventEntityResponseDto[]>(build(ApiEndpoints.predictionMarket.GET_PREDICTION_EVENT_ENTITIES), { params });
  }

  postPredictionMarketSettlement(marketId: number): Observable<void> {
    return this.http.post<void>(
      build(ApiEndpoints.predictionMarket.POST_PREDICTION_MARKET_SETTLEMENT, { marketId }),
      {}
    );
  }

}