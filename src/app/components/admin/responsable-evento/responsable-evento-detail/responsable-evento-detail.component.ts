import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResponsableEvento } from '../../../../core/models/responsable-evento.model';

@Component({
  selector: 'app-responsable-evento-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './responsable-evento-detail.component.html',
  styleUrls: ['./responsable-evento-detail.component.css']
})
export class ResponsableEventoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<ResponsableEventoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResponsableEvento
  ) {}

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getResponsableNombre(): string {
    if (!this.data.cargoDto || !this.data.cargoDto.miembroDto || !this.data.cargoDto.miembroDto.personaDto) return 'N/A';
    const p = this.data.cargoDto.miembroDto.personaDto;
    const tipo = this.data.cargoDto.tipoCargoDto?.nombre || '';
    const iglesia = this.data.cargoDto.iglesiaDto?.nombre || '';
    const nombreBase = `${p.nombre} ${p.apellido}${tipo ? ` (${tipo})` : ''}`;
    return iglesia ? `${nombreBase} - ${iglesia}` : nombreBase;
  }
}
