import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'primary';
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
              [class.btn-primary]="data.type === 'primary'"
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
      font-weight: 700;
      margin: 0;
      padding: 24px 24px 0 24px;
      line-height: 1.4;
      color: var(--text-primary, #1a1f36);
    }
    .dialog-content {
      padding: 12px 24px 0 24px !important;
    }
    .dialog-message {
      font-size: 0.9375rem;
      color: var(--text-secondary, #44474e);
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
      color: var(--text-secondary, #44474e);
      border-color: var(--border-color, #c4c6d0);
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
      color: #ffffff !important;
    }
    .btn-confirm.btn-primary {
      background-color: var(--primary-color, #7F0B85) !important;
    }
    .btn-confirm.btn-primary:hover {
      background-color: #6b0970 !important;
      box-shadow: 0 4px 12px rgba(127, 11, 133, 0.25) !important;
    }
    .btn-confirm.btn-danger {
      background-color: #ba1a1a !important;
    }
    .btn-confirm.btn-danger:hover {
      background-color: #93000a !important;
    }
    .btn-confirm.btn-warning {
      background-color: #e8a317 !important;
    }
    .btn-confirm.btn-warning:hover {
      background-color: #c98b0f !important;
    }
    .btn-confirm.btn-info, .btn-confirm.btn-default {
      background-color: #005cbb !important;
    }
    .btn-confirm.btn-info:hover, .btn-confirm.btn-default:hover {
      background-color: #00458f !important;
    }

    /* Modo oscuro */
    :host-context(.dark-theme) .dialog-title {
      color: #e3e2e6;
    }
    :host-context(.dark-theme) .dialog-message {
      color: #90a4ae;
    }
    :host-context(.dark-theme) .btn-cancel {
      color: #e3e2e6;
      border-color: #23232c;
    }
    :host-context(.dark-theme) .btn-cancel:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) { }
}