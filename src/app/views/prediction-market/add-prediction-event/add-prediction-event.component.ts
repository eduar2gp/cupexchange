import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { PredictionEventCreateRequestDto, EventStatus } from '../../../model/prediction-event.model';
import { PredictionCategory } from '../../../model/prediction-category.model';

@Component({
  selector: 'add-prediction-event',
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
  ],
  templateUrl: './add-prediction-event.component.html',
  styleUrl: './add-prediction-event.component.scss',
})
export class AddPredictionEventComponent implements OnInit, OnChanges {
  private readonly predictionMarketService = inject(PredictionMarketService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = signal<PredictionCategory[]>([]);
  readonly loadingCategories = signal(false);
  readonly submitting = signal(false);
  @Input() categoriesInput: PredictionCategory[] | null = null;

  readonly statusOptions: EventStatus[] = ['SCHEDULED', 'ACTIVE', 'SETTLED', 'CANCELLED'];

  readonly eventForm = this.fb.group({
    categoryId: [null as number | null, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(180)]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    status: ['SCHEDULED' as EventStatus, [Validators.required]],
  });

  ngOnInit(): void {
    if (this.categoriesInput && this.categoriesInput.length > 0) {
      this.categories.set(this.categoriesInput);
      return;
    }
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriesInput']) {
      const incomingCategories = this.categoriesInput ?? [];
      if (incomingCategories.length > 0) {
        this.categories.set(incomingCategories);
      }
    }
  }

  submitEvent(): void {
    if (this.eventForm.invalid || this.submitting()) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const formValue = this.eventForm.getRawValue();
    const startIso = this.toIsoString(formValue.startTime ?? '');
    const endIso = this.toIsoString(formValue.endTime ?? '');

    if (!startIso || !endIso || new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      this.snackBar.open('End time must be later than start time.', 'Close', { duration: 3500 });
      return;
    }

    const payload: PredictionEventCreateRequestDto = {
      categoryId: Number(formValue.categoryId),
      title: (formValue.title ?? '').trim(),
      startTime: startIso,
      endTime: endIso,
      status: formValue.status ?? 'SCHEDULED',
    };

    this.submitting.set(true);
    this.predictionMarketService.postPredictionEvent(payload).pipe(
      take(1),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => {
        this.snackBar.open('Prediction event created successfully.', 'Close', { duration: 3000 });
        this.eventForm.reset({
          categoryId: null,
          title: '',
          startTime: '',
          endTime: '',
          status: 'SCHEDULED',
        });
      },
      error: (err) => {
        console.error('Failed to create prediction event', err);
        this.snackBar.open('Failed to create prediction event.', 'Close', { duration: 4000 });
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
        this.snackBar.open('Failed to load categories.', 'Close', { duration: 3500 });
      },
    });
  }

  private toIsoString(datetimeLocal: string): string | null {
    if (!datetimeLocal) {
      return null;
    }
    const parsed = new Date(datetimeLocal);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  }

}
