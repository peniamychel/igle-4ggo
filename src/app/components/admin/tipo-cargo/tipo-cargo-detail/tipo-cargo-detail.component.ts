import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TipoCargo } from '../../../../core/models/tipo-cargo.model';

@Component({
  selector: 'app-tipo-cargo-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './tipo-cargo-detail.component.html',
  styleUrls: ['./tipo-cargo-detail.component.css']
})
export class TipoCargoDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<TipoCargoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoCargo
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
