import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

export interface DialogData {
  id: number;
  type: string;
}

@Component({
  selector: 'app-transaction-confirm-dialog',
  standalone: true,
  // Added MatInputModule, MatFormFieldModule, and FormsModule
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Process {{data.type}}</h2>
    <mat-dialog-content>
      <p>How would you like to proceed with transaction <strong>#{{data.id}}</strong>?</p>
      
      <mat-form-field appearance="outline" class="full-width" *ngIf="true">
        <mat-label>Failure Reason (Optional for Rejection)</mat-label>
        <textarea matInput [(ngModel)]="reason" placeholder="e.g., Verification failed, KYC incomplete..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onDismiss()">Cancel</button>
      <button mat-flat-button color="warn" (click)="onReject()">REJECT</button>
      <button mat-flat-button color="primary" (click)="onConfirm()">CONFIRM</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { color: var(--color-text); }
    mat-dialog-content { color: var(--color-text-secondary); min-width: 300px; }
    .full-width { width: 100%; margin-top: 10px; }
  `]
})
export class TransactionConfirmDialogComponent {
  reason: string = '';

  constructor(
    public dialogRef: MatDialogRef<TransactionConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close({ action: 'CONFIRM' });
  }

  onReject(): void {
    this.dialogRef.close({ action: 'CANCEL', reason: this.reason });
  }

  onDismiss(): void {
    this.dialogRef.close();
  }
}