import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private searchSubject = new Subject<string>();
  // Observable for the child to subscribe to
  searchQuery$ = this.searchSubject.asObservable();

  updateSearch(query: string) {
    this.searchSubject.next(query);
  }
}
