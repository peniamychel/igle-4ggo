import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

export interface MiembroImportDetalle {
  fila: number;
  ci: string;
  nombre: string;
  apellido: string;
  iglesia: string;
  motivo?: string;
}

export interface MiembroImportResult {
  imported: number;
  omitidos: number;
  importados: MiembroImportDetalle[];
  errores: MiembroImportDetalle[];
}

@Component({
  selector: 'app-miembro-import-report-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './miembro-import-report-dialog.component.html',
  styleUrls: ['./miembro-import-report-dialog.component.css']
})
export class MiembroImportReportDialogComponent {
  importados: MiembroImportDetalle[];
  errores: MiembroImportDetalle[];

  constructor(@Inject(MAT_DIALOG_DATA) public data: MiembroImportResult) {
    this.importados = data?.importados || [];
    this.errores = data?.errores || [];
  }
}
