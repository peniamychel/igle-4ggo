import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Certificado } from '../../../../core/models/certificado.model';

@Component({
  selector: 'app-certificado-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './certificado-detail.component.html',
  styleUrls: ['./certificado-detail.component.css']
})
export class CertificadoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<CertificadoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Certificado
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
