import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { build, ApiEndpoints } from '../api/endpoints';
import { RegionalBalanceResponse } from '../../model/regional-balance.model';

@Injectable({
  providedIn: 'root'
})
export class RegionalBalanceService {
  constructor(private http: HttpClient) {}

  getRegionalBalance(): Observable<RegionalBalanceResponse> {
    const url = build(ApiEndpoints.regionalBalance.GET_REGIONAL_BALANCE);
    return this.http.get<RegionalBalanceResponse>(url);
  }
}