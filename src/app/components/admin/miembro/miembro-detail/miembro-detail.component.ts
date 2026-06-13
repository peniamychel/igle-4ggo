import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Miembro } from '../../../../core/models/miembro.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-miembro-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ImageUrlPipe],
  templateUrl: './miembro-detail.component.html',
  styleUrls: ['./miembro-detail.component.css']
})
export class MiembroDetailComponent {
  showImagePreview = false;

  constructor(
    public dialogRef: MatDialogRef<MiembroDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Miembro
  ) {}

  getProfilePhoto(): string | null {
    return this.data?.uriFoto || null;
  }

  toggleImagePreview(): void {
    this.showImagePreview = !this.showImagePreview;
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return 'No definido';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
