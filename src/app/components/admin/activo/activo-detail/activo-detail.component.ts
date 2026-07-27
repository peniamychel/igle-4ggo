import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Activo } from '../../../../core/models/activo.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-activo-detail',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    ImageUrlPipe
  ],
  templateUrl: './activo-detail.component.html',
  styleUrls: ['./activo-detail.component.css']
})
export class ActivoDetailComponent {

  constructor(
    public dialogRef: MatDialogRef<ActivoDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Activo
  ) {}

  formatDate(dateStr?: string | Date): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.toString();
      
      const day = d.getDate().toString().padStart(2, '0');
      // getMonth() yields 0-11, so we add 1
      const monthNames = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
      ];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr.toString();
    }
  }

  printLabel() {
    this.dialogRef.close('print');
  }
}
