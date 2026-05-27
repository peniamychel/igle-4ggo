import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ParticipacionEvento } from '../../../../core/models/participacion-evento.model';
import { Miembro } from '../../../../core/models/miembro.model';

@Component({
  selector: 'app-participacion-evento-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './participacion-evento-detail.component.html',
  styleUrls: ['./participacion-evento-detail.component.css']
})
export class ParticipacionEventoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<ParticipacionEventoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ParticipacionEvento
  ) {}

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getMiembroNombreCompleto(miembro?: Miembro): string {
    if (!miembro || !miembro.personaDto) return 'N/A';
    return `${miembro.personaDto.nombre} ${miembro.personaDto.apellido}`;
  }
}
