import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.title || 'Por favor confirme' }}</h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-message" [innerHTML]="data.message"></p>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      <button mat-stroked-button mat-dialog-close class="btn-cancel">{{ data.cancelText || 'Cancelar' }}</button>
      <button mat-raised-button [mat-dialog-close]="true"
              [class.btn-danger]="data.type === 'danger'"
              [class.btn-warning]="data.type === 'warning'"
              [class.btn-info]="data.type === 'info'"
              [class.btn-default]="!data.type || data.type === 'info'"
              class="btn-confirm">
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 400px;
    }
    .dialog-title {
      font-size: 1.375rem;
      font-weight: 400;
      margin: 0;
      padding: 24px 24px 0 24px;
      line-height: 1.4;
    }
    .dialog-content {
      padding: 12px 24px 0 24px !important;
    }
    .dialog-message {
      font-size: 0.9375rem;
      color: #44474e;
      line-height: 1.5;
      margin: 0;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px 24px 24px !important;
    }
    .btn-cancel {
      border-radius: 20px;
      padding: 0 24px;
      height: 40px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #44474e;
      border-color: #c4c6d0;
    }
    .btn-cancel:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .btn-confirm {
      border-radius: 20px;
      padding: 0 24px;
      height: 40px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #ffffff;
    }
    .btn-danger {
      background-color: #ba1a1a;
    }
    .btn-danger:hover {
      background-color: #93000a;
    }
    .btn-warning {
      background-color: #e8a317;
    }
    .btn-warning:hover {
      background-color: #c98b0f;
    }
    .btn-info, .btn-default {
      background-color: #005cbb;
    }
    .btn-info:hover, .btn-default:hover {
      background-color: #00458f;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) { }
}