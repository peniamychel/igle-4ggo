import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Iglesia } from '../../../../core/models/iglesia.model';

@Component({
  selector: 'app-iglesia-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './iglesia-detail.component.html',
  styleUrls: ['./iglesia-detail.component.css']
})
export class IglesiaDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<IglesiaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Iglesia
  ) {}

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
