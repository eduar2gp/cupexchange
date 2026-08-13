import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ReportResult } from '../../../model/monthly-statement.model';

@Component({
  selector: 'app-report-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">check_circle</mat-icon>
      Report Generated Successfully
    </h2>
    <mat-dialog-content>
      <p><strong>Total Transactions:</strong> {{ data.rows }}</p>
      <p *ngIf="data.path">
        <strong>Report PDF:</strong> 
        <a [href]="data.path" target="_blank" rel="noopener noreferrer">Click here to download/view PDF</a>
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-raised-button color="primary" (click)="openPdf()" [disabled]="!data.path">
        Open PDF
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    mat-dialog-content { padding-top: 8px; }
    a { color: var(--color-primary); text-decoration: underline; }
  `]
})
export class ReportSuccessDialogComponent {
  data: ReportResult = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ReportSuccessDialogComponent>);

  openPdf(): void {
    if (this.data.path) {
      window.open(this.data.path, '_blank');
      this.dialogRef.close();
    }
  }
}