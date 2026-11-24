import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PredictionEntity } from '../../../model/prediction-entity.model';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'add-prediction-entity',
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
  templateUrl: './add-prediction-entity.component.html',
  styleUrl: './add-prediction-entity.component.scss',
})
export class AddPredictionEntityComponent {
  private readonly predictionMarketService = inject(PredictionMarketService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly entityTypeOptions: Array<PredictionEntity['entityType']> = ['TEAM', 'PLAYER'];
  readonly submitting = signal(false);

  readonly entityForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    entityType: ['TEAM' as PredictionEntity['entityType'], [Validators.required]],
  });

  addPredictionEntity(): void {
    if (this.entityForm.invalid || this.submitting()) {
      this.entityForm.markAllAsTouched();
      return;
    }

    const predictionEntity: PredictionEntity = {
      name: (this.entityForm.value.name ?? '').trim(),
      entityType: (this.entityForm.value.entityType ?? 'TEAM') as PredictionEntity['entityType'],
    };

    this.submitting.set(true);
    this.predictionMarketService.postPredictionEntity(predictionEntity).pipe(
      take(1),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => {
        this.snackBar.open('Prediction entity created successfully.', 'Close', { duration: 3000 });
        this.entityForm.reset({ name: '', entityType: 'TEAM' });
      },
      error: (err) => {
        console.error('Failed to create prediction entity', err);
        this.snackBar.open('Failed to create prediction entity.', 'Close', { duration: 4000 });
      },
    });
  }
}
