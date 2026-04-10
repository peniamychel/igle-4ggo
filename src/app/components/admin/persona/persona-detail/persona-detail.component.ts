import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Persona } from '../../../../core/models/persona.model';

@Component({
  selector: 'app-persona-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './persona-detail.component.html',
  styleUrls: ['./persona-detail.component.css']

})
export class PersonaDetailComponent {
  constructor(
    public dialogRef: MatDialogRef<PersonaDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Persona
  ) {}

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
