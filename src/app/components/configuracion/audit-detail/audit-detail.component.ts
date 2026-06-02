import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditLog } from '../../../core/services/audit-log.service';

@Component({
  selector: 'app-audit-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './audit-detail.component.html',
  styleUrls: ['./audit-detail.component.css']
})
export class AuditDetailComponent {
  private snackBar = inject(MatSnackBar);
  
  parsedMetadata: any = {};
  formattedDate: string = '';

  constructor(
    public dialogRef: MatDialogRef<AuditDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public log: AuditLog
  ) {
    // Intentar formatear la fecha
    try {
      this.formattedDate = new Date(log.fecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      this.formattedDate = log.fecha.toString();
    }

    // Intentar decodificar los metadatos JSON
    try {
      this.parsedMetadata = JSON.parse(log.metadatos);
    } catch (e) {
      this.parsedMetadata = { raw: log.metadatos };
    }
  }

  // Copia el JSON de metadatos al portapapeles
  copyToClipboard(): void {
    const rawJson = JSON.stringify(this.parsedMetadata, null, 2);
    navigator.clipboard.writeText(rawJson).then(
      () => {
        this.snackBar.open('¡Metadatos copiados al portapapeles!', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      () => {
        this.snackBar.open('Error al copiar al portapapeles', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    );
  }

  // Devuelve un icono Material según la acción
  getActionIcon(accion: string): string {
    switch (accion) {
      case 'Acceso': return 'key';
      case 'Creación': return 'add_circle_outline';
      case 'Modificación': return 'edit';
      case 'Eliminación': return 'delete_outline';
      case 'Exportación': return 'download';
      case 'Advertencia': return 'warning_amber';
      default: return 'info';
    }
  }

  // Cierra el diálogo
  close(): void {
    this.dialogRef.close();
  }
}
