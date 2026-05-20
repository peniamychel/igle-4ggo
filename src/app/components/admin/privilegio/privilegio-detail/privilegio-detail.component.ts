import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PrivilegioDto } from '../../../../core/models/interfaces/privilegio.interface';

@Component({
  selector: 'app-privilegio-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './privilegio-detail.component.html',
  styleUrls: ['./privilegio-detail.component.css']
})
export class PrivilegioDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<PrivilegioDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrivilegioDto
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
