import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  id: number;
  type: string;
}

@Component({
  selector: 'app-transaction-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Process {{data.type}}</h2>
    <mat-dialog-content>
      How would you like to proceed with transaction <strong>#{{data.id}}</strong>?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="'REJECT'">REJECT</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="'CONFIRM'">CONFIRM</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { color: var(--color-text); }
    mat-dialog-content { color: var(--color-text-secondary); margin-bottom: 20px; }
  `]
})
export class TransactionConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TransactionConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
}