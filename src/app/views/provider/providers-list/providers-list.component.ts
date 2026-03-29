import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProvidersService } from '../../../core/services/providers.service';
import { Provider } from '../../../model/provider.model';
import { DataService } from '../../../core/services/data.service';
import { Router } from '@angular/router';
import { Role } from '../../../model/roles.enum';

// Material Imports
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-providers-list',
  standalone: true,
  imports: [
    MatListModule, 
    MatIconModule, 
    MatDividerModule, 
    MatButtonModule, 
    MatPaginatorModule
  ],
  templateUrl: './providers-list.component.html',
  styleUrl: './providers-list.component.scss',
})
export class ProvidersListComponent {
  public Role = Role;
  
  private providersService = inject(ProvidersService);
  private dataService = inject(DataService);
  private router = inject(Router);

  // Pagination Signals
  pageSize = signal(10);
  currentPage = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  // 1. Reactive Parameter Signal
  // Whenever currentPage or pageSize changes, this triggers the pipe below
  private paramsSignal = computed(() => ({
    page: this.currentPage(),
    size: this.pageSize()
  }));

  // 2. The Reactive Resource Pipe
  // This replaces the manual fetchProviders() call in ngOnInit
  private providersResource = toSignal(
    toObservable(this.paramsSignal).pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(p => 
        this.providersService.getProvidersPaginated(p.page, p.size).pipe(
          catchError((err) => {
            console.error('Fetch error:', err);
            this.error.set('Failed to load providers');
            return of(null);
          }),
          tap(() => this.loading.set(false))
        )
      )
    ),
    { initialValue: null }
  );

  // 3. Selectors for the Template
  // These automatically update when providersResource receives new data
  providers = computed(() => this.providersResource()?.content ?? []);
  totalElements = computed(() => this.providersResource()?.totalElements ?? 0);

  handlePageEvent(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onClick(provider: Provider) {
    this.dataService.updateProvider(provider);
    this.router.navigate(['/edit-provider']);
  }

  addProvider() {
    this.router.navigate(['/add-provider']);
  }

  trackById(index: number, item: Provider) {
    return item?.id;
  }
}