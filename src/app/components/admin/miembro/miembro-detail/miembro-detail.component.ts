import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Miembro } from '../../../../core/models/miembro.model';

@Component({
  selector: 'app-miembro-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './miembro-detail.component.html',
  styleUrls: ['./miembro-detail.component.css']
})
export class MiembroDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<MiembroDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Miembro
  ) {}

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
