import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TipoCertificado } from '../../../../core/models/tipo-certificado.model';

@Component({
  selector: 'app-tipo-certificado-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './tipo-certificado-detail.component.html',
  styleUrls: ['./tipo-certificado-detail.component.css']
})
export class TipoCertificadoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<TipoCertificadoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoCertificado
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
