import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Persona } from '../../../../core/models/persona.model';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-persona-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ImageUrlPipe
  ],
  templateUrl: './persona-detail.component.html',
  styleUrls: ['./persona-detail.component.css']

})
export class PersonaDetailComponent {
  showImagePreview = false;

  constructor(
    public dialogRef: MatDialogRef<PersonaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Persona
  ) {}

  toggleImagePreview(): void {
    this.showImagePreview = !this.showImagePreview;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
