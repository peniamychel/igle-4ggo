import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TipoEvento } from '../../../../core/models/tipo-evento.model';

@Component({
  selector: 'app-tipo-evento-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './tipo-evento-detail.component.html',
  styleUrls: ['./tipo-evento-detail.component.css']
})
export class TipoEventoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<TipoEventoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoEvento
  ) {}

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
