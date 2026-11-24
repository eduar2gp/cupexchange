import { CommonModule } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, take } from 'rxjs/operators';
import { PredictionMarketService } from '../../../core/services/prediction-market.service';
import { MarketStatus, OutcomeType, PredictionMarketRequest } from '../../../model/prediction-market.model';

@Component({
  selector: 'app-add-prediction-market',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-prediction-market.component.html',
  styleUrl: './add-prediction-market.component.scss',
})
export class AddPredictionMarketComponent {
  private readonly predictionMarketService = inject(PredictionMarketService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  @Input() eventId: number | null = null;

  readonly submitting = signal(false);
  readonly outcomeOptions: OutcomeType[] = ['YES', 'NO'];
  readonly statusOptions: MarketStatus[] = ['OPEN', 'PAUSED', 'CLOSED', 'RESOLVED'];

  readonly marketForm = this.fb.group({
    question: ['', [Validators.required, Validators.maxLength(300)]],
    outcomeType: ['YES' as OutcomeType, [Validators.required]],
    currencyCode: ['USD', [Validators.required, Validators.maxLength(8)]],
    status: ['OPEN' as MarketStatus, [Validators.required]],
    winningOutcome: ['UNSET'],
    yesLabel: ['Yes', [Validators.required, Validators.maxLength(80)]],
    noLabel: ['No', [Validators.required, Validators.maxLength(80)]],
  });

  submitMarket(): void {
    if (!this.eventId) {
      this.snackBar.open('Select an event first to create a market.', 'Close', { duration: 3500 });
      return;
    }

    if (this.marketForm.invalid || this.submitting()) {
      this.marketForm.markAllAsTouched();
      return;
    }

    const formValue = this.marketForm.getRawValue();
    const payload: PredictionMarketRequest = {
      eventId: this.eventId,
      question: (formValue.question ?? '').trim(),
      outcomeType: (formValue.outcomeType ?? 'YES') as OutcomeType,
      currencyCode: (formValue.currencyCode ?? 'USD').toUpperCase(),
      status: (formValue.status ?? 'OPEN') as MarketStatus,
      winningOutcome: this.resolveWinningOutcome(formValue.winningOutcome ?? 'UNSET'),
      yesLabel: (formValue.yesLabel ?? '').trim(),
      noLabel: (formValue.noLabel ?? '').trim(),
    };

    this.submitting.set(true);
    this.predictionMarketService.postPredictionMarket(payload).pipe(
      take(1),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => {
        this.snackBar.open('Prediction market created successfully.', 'Close', { duration: 3000 });
        this.marketForm.reset({
          question: '',
          outcomeType: 'YES',
          currencyCode: 'USD',
          status: 'OPEN',
          winningOutcome: 'UNSET',
          yesLabel: 'Yes',
          noLabel: 'No',
        });
      },
      error: (err) => {
        console.error('Failed to create prediction market', err);
        this.snackBar.open('Failed to create prediction market.', 'Close', { duration: 4000 });
      },
    });
  }

  private resolveWinningOutcome(value: string): boolean | null {
    if (value === 'YES') {
      return true;
    }

    if (value === 'NO') {
      return false;
    }

    return null;
  }

}
