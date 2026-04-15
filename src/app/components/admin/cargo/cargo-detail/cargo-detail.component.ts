import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Cargo } from '../../../../core/models/cargo.model';
import { Miembro } from '../../../../core/models/miembro.model';

@Component({
  selector: 'app-cargo-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './cargo-detail.component.html',
  styleUrls: ['./cargo-detail.component.css']
})
export class CargoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<CargoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Cargo
  ) {}

  formatDate(date: Date | undefined): string {
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
