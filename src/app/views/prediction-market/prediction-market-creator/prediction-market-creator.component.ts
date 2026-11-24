import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { AddPredictionEntityComponent } from '../add-prediction-entity/add-prediction-entity.component'
import { AddPredictionEventComponent } from '../add-prediction-event/add-prediction-event.component'
import { AddPredictionMarketComponent } from '../add-prediction-market/add-prediction-market.component';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { PredictionCategory } from '../../../model/prediction-category.model';
import { EventStatus, PredictionEventResponse } from '../../../model/prediction-event.model';
import { PredictionEntity } from '../../../model/prediction-entity.model';
import { PredictionEventEntityResponseDto } from '../../../model/prediction-event-entity.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-prediction-market-creator.component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AddPredictionEntityComponent,
    AddPredictionEventComponent,
    AddPredictionMarketComponent,
  ],
  templateUrl: './prediction-market-creator.component.html',
  styleUrl: './prediction-market-creator.component.scss',
})
export class PredictionMarketCreatorComponent implements OnInit {
  private readonly predictionMarketService = inject(PredictionMarketService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = signal<PredictionCategory[]>([]);
  readonly loadingCategories = signal(false);
  readonly searchingEvents = signal(false);
  readonly searchingEntities = signal(false);
  readonly linkingEventEntity = signal(false);
  readonly loadingEventEntities = signal(false);
  readonly searchResults = signal<PredictionEventResponse[]>([]);
  readonly entityResults = signal<PredictionEntity[]>([]);
  readonly eventEntities = signal<PredictionEventEntityResponseDto[]>([]);
  readonly selectedEventForMarket = signal<PredictionEventResponse | null>(null);
  readonly selectedEntity = signal<PredictionEntity | null>(null);
  readonly linkedEventEntity = signal<PredictionEventEntityResponseDto | null>(null);
  readonly eventStatusOptions: Array<EventStatus | 'ALL'> = ['ALL', 'SCHEDULED', 'ACTIVE', 'SETTLED', 'CANCELLED'];
  readonly entityTypeOptions: Array<'ALL' | 'TEAM' | 'PLAYER'> = ['ALL', 'TEAM', 'PLAYER'];

  readonly searchForm = this.fb.group({
    categoryId: [null as number | null],
    title: [''],
    status: ['ALL' as EventStatus | 'ALL'],
  });

  readonly entitySearchForm = this.fb.group({
    name: [''],
    entityType: ['ALL' as 'ALL' | 'TEAM' | 'PLAYER'],
  });

  readonly eventEntityForm = this.fb.group({
    eventId: [null as number | null],
    entityId: [null as number | null],
    role: [''],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  searchPredictionEvents(): void {
    const formValue = this.searchForm.getRawValue();
    const categoryId = Number(formValue.categoryId);

    if (!categoryId) {
      this.snackBar.open('Select a category to search events.', 'Close', { duration: 3000 });
      return;
    }

    const title = (formValue.title ?? '').trim();
    const status = (formValue.status ?? 'ALL') === 'ALL' ? '' : (formValue.status as EventStatus);

    this.searchingEvents.set(true);
    this.getSearchPredictionEvents(categoryId, title, status).pipe(
      take(1),
      finalize(() => this.searchingEvents.set(false)),
    ).subscribe({
      next: (events) => {
        this.searchResults.set(events ?? []);
      },
      error: (err) => {
        console.error('Failed to search prediction events', err);
        this.searchResults.set([]);
        this.snackBar.open('Failed to search prediction events.', 'Close', { duration: 3500 });
      },
    });
  }

  clearSearch(): void {
    this.searchForm.reset({ categoryId: null, title: '', status: 'ALL' });
    this.searchResults.set([]);
    this.selectedEventForMarket.set(null);
    this.eventEntities.set([]);
    this.eventEntityForm.patchValue({ eventId: null });
  }

  selectEventForMarket(event: PredictionEventResponse): void {
    this.selectedEventForMarket.set(event);
    this.eventEntityForm.patchValue({ eventId: event.id });
    this.loadEventEntities(event.id);
  }

  searchPredictionEntities(): void {
    const formValue = this.entitySearchForm.getRawValue();
    const name = (formValue.name ?? '').trim();
    if (!name) {
      this.snackBar.open('Enter an entity name to search.', 'Close', { duration: 3000 });
      return;
    }

    const entityType = (formValue.entityType ?? 'ALL') === 'ALL'
      ? undefined
      : (formValue.entityType as 'TEAM' | 'PLAYER');

    this.searchingEntities.set(true);
    this.predictionMarketService.getPredictionEntities(name, entityType).pipe(
      take(1),
      finalize(() => this.searchingEntities.set(false)),
    ).subscribe({
      next: (entities) => {
        this.entityResults.set(entities ?? []);
      },
      error: (err) => {
        console.error('Failed to search prediction entities', err);
        this.entityResults.set([]);
        this.snackBar.open('Failed to search prediction entities.', 'Close', { duration: 3500 });
      },
    });
  }

  selectEntity(entity: PredictionEntity): void {
    this.selectedEntity.set(entity);
    this.eventEntityForm.patchValue({ entityId: entity.id ?? null });
  }

  linkEventToEntity(): void {
    const formValue = this.eventEntityForm.getRawValue();
    const eventId = Number(formValue.eventId);
    const entityId = Number(formValue.entityId);
    const role = (formValue.role ?? '').trim();

    if (!eventId || !entityId) {
      this.snackBar.open('Select both event and entity before linking.', 'Close', { duration: 3200 });
      return;
    }

    this.linkingEventEntity.set(true);
    this.predictionMarketService.postPredictionEventEntity({
      eventId,
      entityId,
      role: role || undefined,
    }).pipe(
      take(1),
      finalize(() => this.linkingEventEntity.set(false)),
    ).subscribe({
      next: (response) => {
        this.linkedEventEntity.set(response);
        this.snackBar.open('Event entity linked successfully.', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to link event and entity', err);
        this.snackBar.open('Failed to link event and entity.', 'Close', { duration: 3500 });
      },
    });
  }

  getSearchPredictionEvents(categoryId: number, title: string, status: string) {
    return this.predictionMarketService.getSearchPredictionEvents(categoryId, title, status);
  }

  private loadEventEntities(eventId: number): void {
    this.loadingEventEntities.set(true);
    this.predictionMarketService.getPredictionEventEntities(eventId).pipe(
      take(1),
      finalize(() => this.loadingEventEntities.set(false)),
    ).subscribe({
      next: (eventEntities) => {
        this.eventEntities.set(eventEntities ?? []);
      },
      error: (err) => {
        console.error('Failed to load prediction event entities', err);
        this.eventEntities.set([]);
        this.snackBar.open('Failed to load event entities.', 'Close', { duration: 3500 });
      },
    });
  }

  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.predictionMarketService.getPredictionCategories().pipe(
      take(1),
      finalize(() => this.loadingCategories.set(false)),
    ).subscribe({
      next: (categories) => {
        this.categories.set(categories ?? []);
      },
      error: (err) => {
        console.error('Failed to load prediction categories', err);
        this.snackBar.open('Failed to load prediction categories.', 'Close', { duration: 3500 });
      },
    });
  }

}
