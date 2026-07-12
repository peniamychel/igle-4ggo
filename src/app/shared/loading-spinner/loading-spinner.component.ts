import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Indicador de carga circular reutilizable para tablas/listados.
 * Se muestra mientras los datos aun no llegaron, para no enseñar
 * prematuramente el mensaje de "no se encontraron registros".
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-spinner-container" role="status" aria-live="polite">
      <mat-progress-spinner
        mode="indeterminate"
        [diameter]="diameter"
        [strokeWidth]="strokeWidth">
      </mat-progress-spinner>
      <p class="loading-spinner-message" *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px 24px;
      width: 100%;
      box-sizing: border-box;
    }
    .loading-spinner-message {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--text-secondary, #6b7280);
    }
    /* Color de marca para el circulo (indeterminate stroke) */
    .loading-spinner-container ::ng-deep circle {
      stroke: var(--primary-color, #7F0B85);
    }
    :host-context(.dark-theme) .loading-spinner-message {
      color: #90a4ae;
    }
  `]
})
export class LoadingSpinnerComponent {
  /** Diametro del circulo en px. */
  @Input() diameter = 48;
  /** Grosor del trazo del circulo. */
  @Input() strokeWidth = 4;
  /** Texto opcional bajo el spinner. */
  @Input() message = 'Cargando...';
}
