import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { build, ApiEndpoints } from '../api/endpoints';
import { GeoCuba } from '../../model/geo-cuba.model';

@Injectable({
  providedIn: 'root',
})
export class GeocubaService {
  
  constructor(private http: HttpClient) {}

  getProvinceAndMunicipality(latitude: number, longitude: number): Observable<GeoCuba> {
    const url = build(ApiEndpoints.geocuba.GET_PROVINCE_AND_MUNICIPALITY, { latitude, longitude });
    return this.http.get<GeoCuba>(url);
  }
}