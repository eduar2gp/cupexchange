import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Municipality } from '../../model/muncipality.model'
import { Province } from '../../model/province.model'

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private http = inject(HttpClient);
  private GET_PROVINCES = '/api/v1/location/provinces';
  private GET_MUNICIPALITIES = '/api/v1/location/municipalities';
  
  getProvinces(): Observable<Province[]> {
    const fullUrl = `${environment.baseApiUrl}${this.GET_PROVINCES}`;
    return this.http.get<Province[]>(fullUrl);
  }

  getMunicipalities(): Observable<Municipality[]> {
    const fullUrl = `${environment.baseApiUrl}${this.GET_MUNICIPALITIES}`;
    return this.http.get<Municipality[]>(fullUrl);
  }
}
