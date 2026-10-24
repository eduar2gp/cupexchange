import { Injectable } from '@angular/core';
import { build, ApiEndpoints } from '../../../app/core/api/endpoints';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../../model/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

    private fullUrl = build(ApiEndpoints.category.GET_CATEGORIES);

    constructor(private http: HttpClient) { }

    getCategories(): Observable<Category[]> {
      return this.http.get<Category[]>(this.fullUrl);
    }

}