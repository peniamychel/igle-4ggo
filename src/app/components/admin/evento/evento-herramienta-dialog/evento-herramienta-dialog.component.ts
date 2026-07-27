import { Component, Inject, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Diálogo host genérico: renderiza un componente (Calendario, Tipos de Evento,
 * Responsables o Participaciones) dentro de un modal con encabezado y botón de
 * cerrar. Usa ngComponentOutlet para no crear un wrapper por cada herramienta.
 */
@Component({
  selector: 'app-evento-herramienta-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="herramienta-dialog">
      <div class="dialog-header">
        <div class="header-title">
          <mat-icon class="header-icon">{{ data.icon }}</mat-icon>
          <h2 mat-dialog-title>{{ data.title }}</h2>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <mat-dialog-content class="dialog-content">
        <ng-container *ngComponentOutlet="data.component"></ng-container>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .herramienta-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color, #e3e8ee);
      flex-shrink: 0;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      color: var(--primary-color, #7F0B85);
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary, #1a1f36);
      letter-spacing: -0.4px;
    }
    .close-btn {
      color: var(--text-secondary, #697386);
    }
    .dialog-content {
      padding: 16px 24px 24px !important;
      overflow: auto;
      flex: 1;
    }
  `]
})
export class EventoHerramientaDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; icon: string; component: Type<any> }
  ) {}
}
