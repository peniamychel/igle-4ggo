import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content class="custom-content">

      <p class="dialog-message" [innerHTML]="data.message"></p>
    </mat-dialog-content>
    <mat-dialog-actions class="full-width-actions">
      <button mat-button mat-dialog-close class="dialog-btn cancel-btn">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true" class="dialog-btn confirm-btn">Confirmar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .custom-content {
      min-width: 300px;
      padding: 24px 24px 8px 24px !important;
      text-align: center;
    }
    .dialog-message {
      font-size: 1.1rem;
      margin-bottom: 0;
      line-height: 1.5;
    }
    .full-width-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px !important;
      margin-bottom: 8px;
    }
    .dialog-btn {
      flex: 1;
      margin: 0 8px !important;
      padding: 8px 0;
    }
    .cancel-btn {
      background-color: #f5f5f5;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      message: string;
    }
  ) { }
}